export type ContractPipelineRoute = 'generate' | 'guest-generate' | 'guest-import';

export function logContractPipelineError(
  route: ContractPipelineRoute,
  actor: string | null,
  stage: string,
  err: unknown,
): void {
  const who = actor ? ` actor=${actor}` : '';
  console.error(`[contracts:${route}]${who} ERROR «${stage}»`, err);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
}
