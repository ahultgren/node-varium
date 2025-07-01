type Validators = Record<string, (string) => any>;

type ValidationError = {
  error$: string;
};

type Env = Record<string, any>;

export { Validators, ValidationError, Env };
