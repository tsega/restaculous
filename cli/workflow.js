export async function runWorkflow(settings, services, onStageComplete = () => {}) {
  const stages = [
    ["structure", services.structure.generate],
    ...(settings.authentication
      ? [["authentication", services.authentication.generate]]
      : []),
    ["models", services.models.generate],
    ["controllers", services.controllers.generate],
    ["routes", services.routes.generate],
    ["validators", services.validators.generate],
    ["tests", services.tests.generate],
    ["base", services.base.generate],
    ["dependencies", services.dependencies.generate],
    ["format", services.format.runFormatter],
    ["lint", services.lint.runLinter]
  ];

  for (const [name, run] of stages) {
    await runStage(name, run, settings);
    onStageComplete(name);
  }
}

function runStage(name, run, settings) {
  return new Promise((resolve, reject) => {
    let completed = false;

    function complete(error) {
      if (completed) {
        return;
      }
      completed = true;

      if (error) {
        reject(new Error(`${name} stage failed: ${error.message}`, { cause: error }));
        return;
      }

      resolve();
    }

    try {
      run(settings, complete);
    } catch (error) {
      complete(error);
    }
  });
}
