import parse from "./parse";
import lex from "./lex";

export default (input: string): ReturnType<typeof parse> => parse(lex(input));
