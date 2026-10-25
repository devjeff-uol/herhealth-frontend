<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { questionnaire as form, reportState, summaryPayload } from '../questionnaire.js'
import { apiRequest } from '../api.js'
const emit = defineEmits(['navigate'])
const adding=ref(false), medication=ref(''), frequency=ref('')
const options=[['🏋️','Gentle exercise'],['🥗','Diet changes'],['💬','Therapy or CBT'],['💊','Magnesium'],['🌿','Acupuncture'],['🌙','Sleep routine'],['🧘','Yoga']]
const schema=ref(null), optionsError=ref(''), loadingOptions=ref(false)
const now=new Date()
const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-')
const controller = new AbortController()
const impactFace=computed(()=>form.impact===''?'':Number(form.impact)<3?'🙂':Number(form.impact)<6?'😐':Number(form.impact)<8?'😟':'😣')
async function loadOptions(){
 loadingOptions.value=true;optionsError.value=''
 try { schema.value=await apiRequest('summary-options', {signal:controller.signal}) }
 catch(error){if(!controller.signal.aborted)optionsError.value=error.message}
 finally { loadingOptions.value=false }
}
onMounted(loadOptions)
onBeforeUnmount(()=>controller.abort())
function toggle(name){const index=form.solutions.indexOf(name);if(index<0)form.solutions.push(name);else form.solutions.splice(index,1)}
function addMedication(){if(!medication.value.trim())return;form.medications.push({name:medication.value.trim(),frequency:frequency.value.trim()});medication.value='';frequency.value='';adding.value=false}
async function generate(){
 if(reportState.pending)return
 reportState.pending=true;reportState.error=''
 try {
  const report=await apiRequest('gp-summary',{body:summaryPayload(),signal:controller.signal})
  if(!report.summary || !report.text || !report.pdf_base64)throw new Error('The report was incomplete. Please try again.')
  reportState.report=report;reportState.stale=false
  emit('navigate','summary')
 } catch(error){if(!controller.signal.aborted)reportState.error=error.message}
 finally {reportState.pending=false}
}
</script>
<template>
<div class="design-screen stack questions-page"><header class="page-header"><a class="icon-btn" href="#patterns" aria-label="Back to Patterns">‹</a><div><h1>Your GP summary</h1><p class="muted">Tell us about your recent menstrual health</p></div></header>
<p class="intro">Your answers are sent to HerHealth to prepare a report and PDF. Nothing is sent to your GP automatically. Please leave out your name and contact details.</p>
<div v-if="optionsError" class="card" role="alert"><p>{{optionsError}}</p><button class="secondary" @click="loadOptions">Retry connection</button></div>
<p v-if="loadingOptions" class="intro" role="status">Connecting to the report service…</p>
<form class="stack" @submit.prevent="generate" :aria-busy="reportState.pending">
<fieldset :disabled="reportState.pending" class="question-fields stack">
<section class="card"><h2><span class="question-number">1</span>Your recent period</h2>
<label class="check-field"><input type="checkbox" v-model="form.periodUnknown"> I don't know the dates / no recent period</label>
<div v-if="!form.periodUnknown" class="date-fields"><label class="field">First day<input type="date" v-model="form.periodStart" :max="today" required></label><label class="check-field"><input type="checkbox" v-model="form.ongoing"> I'm still on my period</label><label v-if="!form.ongoing" class="field">Last day<input type="date" v-model="form.periodEnd" :min="form.periodStart || undefined" :max="today" required></label></div>
<label class="field">Heaviest flow<select v-model="form.flow"><option value="">Not sure / not recorded</option><option v-for="flow in schema?.flows || []" :key="flow">{{flow}}</option></select></label>
<label class="field">Worst period pain (0–10)<select v-model="form.pain"><option value="">Not sure / not rated</option><option v-for="n in 11" :key="n" :value="n-1">{{n-1}}{{n===1?' — no pain':n===11?' — worst imaginable':''}}</option></select></label>
<p class="muted">Unknown answers stay unknown. We won't fill them in using demo calendar records.</p></section>
<section class="card"><h2><span class="question-number">2</span>What symptoms have you noticed recently?</h2><p class="muted">Rate symptoms you noticed. Leave the rest as not reported.</p>
<details v-for="(symptoms, group) in schema?.symptom_groups || {}" :key="group" class="symptom-group"><summary>{{group}}</summary><label class="symptom-field" v-for="(label,key) in symptoms" :key="key"><span>{{label}}</span><select v-model="form.symptoms[key]" :aria-label="label"><option value="">Not reported</option><option :value="1">Mild</option><option :value="2">Moderate</option><option :value="3">Severe</option></select></label></details>
<label class="field">Age (optional)<input v-model="form.age" type="number" min="12" max="90" step="1" placeholder="Your age in years"></label><label class="check-field"><input v-model="form.menopause" type="checkbox"> My periods stopped 12 or more months ago</label></section>
<section class="card"><h2><span class="question-number">3</span>What have you tried?</h2><div class="chip-row"><button type="button" v-for="[emoji,name] in options" :key="name" class="chip" :aria-pressed="form.solutions.includes(name)" @click="toggle(name)"><span>{{emoji}}</span> {{name}}</button></div><label class="field">What helped or didn't help?<textarea v-model="form.treatmentNotes" rows="3" maxlength="2000" placeholder="Treatments, solutions and side effects"></textarea></label>
<h3>Current medication</h3><div v-for="(med,i) in form.medications" :key="i" class="medication"><div><strong>{{med.name}}</strong><span class="muted">{{med.frequency || 'Frequency not recorded'}}</span></div><button type="button" class="remove" :aria-label="'Remove '+med.name" @click="form.medications.splice(i,1)">×</button></div><p v-if="!form.medications.length" class="muted">No medications added.</p><button type="button" class="secondary full" @click="adding=!adding" :aria-expanded="adding">＋ Add medication or solution</button>
<div v-if="adding"><label class="field">Medication or solution<input v-model="medication" maxlength="100" placeholder="Name and dose"></label><label class="field">Frequency<input v-model="frequency" maxlength="100" placeholder="e.g. Once daily"></label><button type="button" class="primary full" :disabled="!medication.trim()" @click="addMedication">Add medication</button></div></section>
<section class="card"><h2><span class="question-number">4</span>How does this affect your daily life?</h2><div v-if="impactFace" class="impact-face" aria-hidden="true">{{impactFace}}</div><label class="field">Impact on daily life (0–10)<select v-model="form.impact"><option value="">Not sure / not rated</option><option v-for="n in 11" :key="n" :value="n-1">{{n-1}}{{n===1?' — no effect':n===8?' — stops usual activities':n===11?" — can't get out of bed":''}}</option></select></label><label class="field">Anything you would like your clinician to know?<textarea v-model="form.notes" rows="4" placeholder="What would you most like help with? How does it affect work, sleep, relationships or your day-to-day life?" maxlength="2000"></textarea></label></section>
</fieldset>
<div class="create-summary"><p v-if="reportState.error" role="alert" class="notice">{{reportState.error}}</p><button class="primary full" :disabled="reportState.pending || !schema">{{reportState.pending?'Preparing your report…':'Create summary for healthcare professional →'}}</button><p class="muted">Generated with HerHealth's health checks. Not a diagnosis.<br>Your answers and report stay in this session; they aren't saved to an account.</p></div>
</form></div>
</template>
<style scoped>
.questions-page{background:#eedee9!important}.page-header{justify-content:flex-start;padding-bottom:10px}h1{font-family:Georgia,serif;font-style:italic;font-size:25px;font-weight:500;color:#6d5383;line-height:1.3}.intro{margin:0 18px;font-size:12px;line-height:1.7;color:#64516f}.card{background:#fbf8f8}h2{font-size:14px;line-height:1.8;color:#556151}.question-number{font-size:12px}.chip span{font-size:19px;margin-right:5px}.medication{border-top:1px solid #e8e2e7;padding:13px 0;display:flex;align-items:center;justify-content:space-between}.medication strong{display:block;font-size:13px}.remove{background:transparent;border:0;color:#8a657d;font-size:24px;width:44px;height:44px}.impact-face{text-align:center;font-size:50px;margin:12px 0}.create-summary{margin:4px 14px;text-align:center}.create-summary p{font-size:11px}.question-fields{border:0;padding:0;margin:0;min-width:0}.check-field{display:flex;align-items:flex-start;gap:9px;font-size:12px;line-height:1.7;margin:12px 0}.check-field input{flex:none;margin-top:4px;accent-color:#8c60a8}select{font:inherit;min-height:44px;max-width:100%;padding:10px;border:1px solid #d9dcee;border-radius:10px;background:white;color:#1d2140}.symptom-group{border-top:1px solid #e5dce9;padding:12px 0}.symptom-group summary{font-size:13px;font-weight:600;cursor:pointer;min-height:28px}.symptom-field{display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:10px;align-items:center;font-size:11px;line-height:1.6;margin-top:10px}.symptom-field select{width:100%;font-size:11px;padding:6px}.field input[type=date]{min-width:0;min-height:44px}button:disabled{opacity:.6;cursor:wait}
</style>
