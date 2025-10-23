export const select = <T>(
  data: any,
  selection?: Partial<Record<keyof T, boolean | object>>
) => {
  if (!data) return;

  return Object.keys(data).reduce((acc, key) => {
    if (selection && selection[key]) {
      if (typeof selection[key] === "boolean") acc[key] = data[key];
      else if (typeof selection[key] === "object")
        acc[key] = select(data[key], selection[key]);
    }
    return acc;
  }, {});
};

export const selectFromArray = <T>(
  array: any[],
  selection?: Partial<Record<keyof T, boolean | object>>
) => {
  return array.map((data) => select<T>(data, selection));
};
