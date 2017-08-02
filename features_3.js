/*
  Measure outcomes, statistically analyse data, and automatically adjust rollout

  The lens for the EXPERIMENTS projection
  Only sales events included for analysis and rollout automation
*/

import {
  tTestTwoSample as t, 
  cumulativeStdNormalProbability as p
} from 'simple-statistics'


export const editExperiment = createExperimentAction('EXPERIMENT_EDITED',
  (projection, {experiment, rollout, timestamp}) => ({
    ...projection,
    experimentList: uniq([
      ...(projection.experimentList || []),
      experiment
    ]),
    [experiment]: {
      ...(projection[experiment] || {}),
      experiment,
      rollout,
      experimentAddedAt: projection[experiment] 
        ? projection[experiment].experimentAddedAt 
        : timestamp,
      experimentModifiedAt: timestamp
    }
  })
)


export const experimentOverride = createExperimentAction('EXPERIMENT_OVERRRIDE_ADDED',
  (projection, {token, experiment, override}) => ({
    ...projection,
    [token]: {
      ...(projection[token] || {}),
      [experiment]: override
    }
  })
)


// Handle sales events
createExperimentAction('SALE_RECEIPTED',
  (projection, {experiments, amount}) => 
    updateExperimentValue({
      projection, 
      experiments, 
      key: 'income', 
      handleData: (data = []) => [...data, parseFloat(amount)].slice(-500), 
      strategy: significantDiff
    })
)


// Generic reducer to handle all automated rollout from config
const updateExperimentValue = ({projection, experiments, key, handleData, strategy}) => 
  keys(experiments).reduce((acc, experiment) => {
    const group = experiments[experiment] ? 'experiment' : 'control'
    const existingExperiment = projection[experiment] || {}
    const existingGroup = existingExperiment[group] || {}
    const existingData = existingGroup[key]

    const newExperiment = {
      ...existingExperiment,
      [group]: {
        ...existingGroup,
        [key]: existingExperiment.rollout > 0 ? handleData(existingData) : existingData
      }
    }

    const {
      rollout, 
      control: {[key]: control} = {}, 
      experiment: {[key]: experiment} = {}
    } = newExperiment

    return {
      ...acc,
      [experiment]: {
        ...newExperiment,
        rollout: (rollout !== 0 && rollout !== 100) 
          ? strategy(control, experiment, rollout) 
          : rollout
      }
    }
  }, projection)


// Analyse data for statistical significance
// Increase rollout if confident experiment performs better
// Decrease rollout if confident control performs better
const significantDiff = (control = [], experiment = [], rollout) => {
  if (control.length + experiment.length < 60) return rollout
  const P = p(t(control, experiment, 0))
  const mod = P < 0.05 ? 1 : P > 0.95 ? -1 : 0
  return max(min(rollout + mod, 100), 0)
}
