export function reduceError(error: any, prependPath?: string) {
  if (prependPath === undefined) {
    return `${error.dataPath.substring(1)} | ${error.message}`;
  } else {
    if (error.dataPath.substring(1).length > 0) {
      return `${prependPath}.${error.dataPath.substring(1)} | ${error.message}`;
    } else {
      return `${prependPath} | ${error.message}`;
    }
  }

}

export function reduceErrors(errors: any, prependPath?: string) {

  let reduced = new Array<string>();
  if (errors !== undefined) {
    for (let error of errors) {
      reduced.push(reduceError(error, prependPath));
    }
  }
  return reduced;
}
