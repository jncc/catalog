export function reduceErrors(errors: any, prependPath?: string) {
    let reduced = new Array<string>();
    if (errors !== undefined) {
        for (let error of errors) {
            if (prependPath === undefined) {
                reduced.push(`${error.dataPath.substring(1)} | ${error.message}`);
            } else {
                if (error.dataPath.substring(1).length > 0) {
                    reduced.push(`${prependPath}.${error.dataPath.substring(1)} | ${error.message}`);
                } else {
                    reduced.push(`${prependPath} | ${error.message}`);
                }
            }
        }
    }

    return reduced;
}
