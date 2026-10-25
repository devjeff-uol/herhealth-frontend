import { reactive, watch } from 'vue'
export const questionnaire = reactive({
  periodStart: '', periodEnd: '', ongoing: false, periodUnknown: false,
  flow: '', pain: '', impact: '', age: '', menopause: false, symptoms: {},
  solutions: [], medications: [], notes: '', treatmentNotes: ''
})
// Reports and answers stay in memory, separate from the demo calendar records.
export const reportState = reactive({ report: null, pending: false, error: '', stale: false })
watch(questionnaire, () => { if (reportState.report) reportState.stale = true }, { deep: true, flush: 'sync' })

export function summaryPayload(form = questionnaire) {
  const optionalNumber = value => value === '' || value == null ? null : Number(value)
  return {
    period_start: form.periodUnknown ? null : form.periodStart || null,
    period_end: form.periodUnknown || form.ongoing ? null : form.periodEnd || null,
    period_unknown: form.periodUnknown, ongoing: !form.periodUnknown && form.ongoing,
    flow: form.flow || null, pain: optionalNumber(form.pain), impact: optionalNumber(form.impact),
    age: optionalNumber(form.age), menopause: form.menopause,
    symptoms: Object.fromEntries(Object.entries(form.symptoms).filter(([,value]) => Number(value)>0).map(([key,value]) => [key, Number(value)])),
    solutions: [...form.solutions], medications: form.medications.map(({name,frequency})=>({name,frequency})),
    concern: form.notes, treatment_notes: form.treatmentNotes
  }
}
