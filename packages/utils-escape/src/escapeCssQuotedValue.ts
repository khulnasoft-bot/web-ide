// doesn't allow the value to end the quoted string
export const escapeCssQuotedValue = (val: string) => val.replace('"', '%22').replace("'", '%27');
