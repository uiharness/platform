import { Subject } from 'rxjs';
import { coord, t, time, util } from '../common';

const CellRange = coord.range.CellRange;

/**
 * Calculate.
 */
export function one<D = any>(args: {
  cell: string;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
  eid?: string; // "execution" identifier.
  events$?: Subject<t.FuncEvent>;
}): t.FuncPromise<t.IFuncResponse<D>> {
  const timer = time.timer();
  const { cell, refs, getValue, getFunc } = args;
  const eid = args.eid || util.eid();

  const fire = (e: t.IFuncBeginEvent | t.IFuncEndEvent) => {
    if (args.events$) {
      args.events$.next(e);
    }
  };

  const promise = new Promise<t.IFuncResponse<D>>(async (resolve) => {
    const formula = (await getValue(cell)) || '';

    // Fire PRE event.
    fire({
      type: 'FUNC/begin',
      payload: { eid, cell, formula },
    });

    // Prepare formula.
    const isFormula = util.isFormula(formula);
    const node = isFormula ? coord.ast.toTree(formula) : undefined;
    const type = util.toRefTarget(formula);
    const path = cell;

    const fail = (error: t.IFuncError) => {
      const elapsed = timer.elapsed.msec;
      const res: t.IFuncResponse<D> = { ok: false, eid, elapsed, type, cell, formula, error };
      fire({ type: 'FUNC/end', payload });
      return resolve(res);
    };

    // Ensure the node is not part of a circular-ref sequence.
    if (type === 'REF' || type === 'FUNC') {
      const errors = util.getCircularErrors(refs);
      const isCircular = errors.some((err) => err.path.split('/').includes(cell));
      if (isCircular) {
        const match = errors.find((err) => err.path.startsWith(cell));
        const circularPath = match ? match.path : path;
        const error: t.IFuncErrorCircularRef = {
          type: 'REF/circular',
          message: `The cell ${cell} contains a circular reference (${circularPath}).`,
          path: circularPath,
          formula,
          children: errors,
        };
        return fail(error);
      }
    }

    // Ensure the node is a function/expression.
    if (!node || !isFormula) {
      const error: t.IFuncErrorNotFormula = {
        type: 'FUNC/notFormula',
        message: `The value of cell ${cell} is not a formula. Must start with "=".`,
        path,
        formula,
      };
      return fail(error);
    }

    // Disallow RANGE types.
    // NB: Ranges can be used as parameters, but a range on it's own (eg "=A1:Z9")
    //     makes no sense from this context of calculating something.
    if (type === 'RANGE') {
      const error: t.IFuncErrorNotSupportedRange = {
        type: 'FUNC/notSupported/range',
        message: `The cell ${cell} is a range which is not supported.`,
        path,
        formula,
      };
      return fail(error);
    }

    // Evaluate the function/expression.
    let data: any;
    let error: t.IFuncError | undefined;
    try {
      if (node.type === 'binary-expression') {
        data = await evalExpr({ cell, formula, node, refs, getValue, getFunc });
      }
      if (node.type === 'function') {
        data = await evalFunc({ cell, formula, node, refs, getValue, getFunc });
      }
      if (node.type === 'cell') {
        data = await getCellRefValue({ cell, node, refs, getValue, getFunc });
      }
    } catch (err) {
      error = util.fromErrorObject(err, { path, formula });
    }

    // Prepare response.
    const ok = !error;
    const elapsed = timer.elapsed.msec;
    let payload: t.IFuncResponse<D> = { ok, type, eid, elapsed, cell, formula, data };
    payload = error ? { ...payload, error } : payload;

    // Finish up.
    fire({ type: 'FUNC/end', payload });
    resolve(payload);
  });

  // Assign initial properties to the returned
  // promise for use prior to resolving.
  (promise as any).eid = eid;
  return promise as t.FuncPromise<t.IFuncResponse<D>>;
}

/**
 * [Internal]
 */

const getExprFunc = async (
  getFunc: t.GetFunc,
  operator: coord.ast.BinaryExpressionNode['operator'],
) => {
  if (operator === '+') {
    return getFunc({ name: 'SUM', namespace: 'sys' });
  }

  // TEMP 🐷 TODO - all the other expressions: '>' | '<' | '=' | '>=' | '<=' | '+' | '-' | '&'

  return undefined;
};

const evalNode = async (args: {
  cell: string;
  formula: string;
  node: coord.ast.Node;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
}) => {
  const { node, cell, formula, refs, getValue, getFunc } = args;

  if (coord.ast.isValueNode(node)) {
    return (node as any).value;
  }
  if (node.type === 'binary-expression') {
    return evalExpr({ cell, formula, node, refs, getValue, getFunc }); // <== RECURSION 🌳
  }
  if (node.type === 'function') {
    return evalFunc({ cell, formula, node, refs, getValue, getFunc }); // <== RECURSION 🌳
  }
  if (node.type === 'cell') {
    return getCellRefValue({ cell, refs, node, getValue, getFunc }); //   <== RECURSION 🌳
  }
  if (node.type === 'cell-range') {
    return getRangeValues({
      cell,
      node: node as coord.ast.CellRangeNode,
      refs,
      getValue,
      getFunc,
    }); // <== RECURSION 🌳
  }
};

/**
 * Execute a binary-expression (eg "=A+A1").
 */
const evalExpr = async (args: {
  cell: string;
  formula: string;
  node: coord.ast.BinaryExpressionNode;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
  level?: number;
}) => {
  const { cell, formula, node, refs, getValue, getFunc, level = 0 } = args;
  const func = await getExprFunc(getFunc, node.operator);
  if (!func) {
    const err = `Binary expression operator '${node.operator}' is not mapped to a corresponding function.`;
    throw new Error(err);
  }

  const toValue = async (node: coord.ast.Node) => {
    return node.type === 'binary-expression'
      ? evalExpr({ cell, formula, refs, getValue, getFunc, node, level: level + 1 }) // <== RECURSION 🌳
      : evalNode({ cell, formula, node, getValue, getFunc, refs });
  };

  // Retrieve left/right parameters.
  const left = await toValue(node.left);
  const right = await toValue(node.right);
  const params = [left, right];

  // Invoke the function.
  const res: t.FuncResponse = await func({ params });
  return res;
};

/**
 * Execute a function (eg "=SUM(1,A1)").
 */
const evalFunc = async (args: {
  cell: string;
  formula: string;
  node: coord.ast.FunctionNode;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
  level?: number;
}) => {
  const { cell, formula, node, refs, getValue, getFunc } = args;
  const name = node.name;
  const namespace = node.ns || 'sys';

  // Lookup the function.
  const func = await getFunc({ name, namespace });
  if (!func) {
    throw util.toErrorObject({
      type: 'FUNC/notFound',
      message: `The function [${namespace}.${name}] was not found.`,
      path: cell,
      formula,
    });
  }

  // Calculate parameter values.
  const getParam = (node: coord.ast.Node) =>
    evalNode({ cell, formula, node, refs, getValue, getFunc });
  const params = await Promise.all(node.arguments.map((node) => getParam(node)));

  // Invoke the function.
  const res: t.FuncResponse = await func({ params });
  return res;
};

/**
 * Lookup a cell REF (eg =A1) and return it's evaluated value.
 */
const getCellRefValue = async (args: {
  cell: string;
  node: coord.ast.CellNode;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
}) => {
  const { cell, refs, getValue, getFunc } = args;
  util.throwIfCircular({ cell, refs });

  // Read the current cell value for the node.
  const targetKey = coord.cell.toRelative(args.node.key);
  let value = (await getValue(targetKey)) || '';

  // Calculate formulas into final values.
  if (util.isFormula(value)) {
    value = await evalNode({
      node: coord.ast.toTree(value) as coord.ast.BinaryExpressionNode | coord.ast.FunctionNode,
      cell: targetKey,
      formula: value,
      refs,
      getValue,
      getFunc,
    }); // <== RECURSION 🌳
  }

  // Finish up.
  return value;
};

/**
 * Execute a function that contains a range.
 */
const getRangeValues = async (args: {
  cell: string;
  node: coord.ast.CellRangeNode;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
}) => {
  const { cell, node, refs, getValue, getFunc } = args;
  util.throwIfCircular({ cell, refs });
  const range = CellRange.fromCells(node.left.key, node.right);
  const wait = range.keys.map(async (cell) => {
    const value = await getValue(cell);
    return util.isFormula(value)
      ? (await one({ cell, refs, getValue, getFunc })).data // <== RECURSION 🌳
      : value;
  });
  return (await Promise.all(wait)) as any[];
};
