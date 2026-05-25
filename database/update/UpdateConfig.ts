export type UpdateConfig<
  E extends object,
  K extends readonly (keyof E & string)[]
> = {
  fields: K;
};

export function createUpdateConfig<E extends object>() {
  return <const K extends readonly (keyof E & string)[]>(
    fields: K
  ): UpdateConfig<E, K> => ({ fields });
}

export type UpdateDtoFromConfig<
  E extends object,
  C extends UpdateConfig<E, readonly (keyof E & string)[]>
> = Partial<Pick<E, Extract<C["fields"][number], keyof E>>>;
