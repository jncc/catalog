export function reduceErrors(errors: any) {
    let reduced = new Array<string>();
    if (errors != undefined) {
        for (let error of errors) {
            reduced.push(`${error.dataPath.substring(1)} | ${error.message}`);
        }
    }

    return reduced;
};
