type Uuid = `${string}-${string}-${string}-${string}-${string}`;

declare const BrandSym: unique symbol;
export type Branded<T, Label> = T & { [BrandSym]?: Label };

export type ProblemId = Branded<Uuid, 'ProblemId'>;
export type TestcaseId = Branded<Uuid, 'TestcaseId'>;
export type ClientId = Branded<Uuid, 'ClientId'>;
export type BatchId = Branded<Uuid, 'BatchId'>;
