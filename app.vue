<script setup lang="ts">
import { SupabaseClient, createClient } from '@supabase/supabase-js'

// User Inputs
const supaUrl: Ref<string | null> = ref('https://rbwlyfckkrurhpmmrlvq.supabase.co/')
const supaKey: Ref<string | null> = ref('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJid2x5ZmNra3J1cmhwbW1ybHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzM0NDI2ODUsImV4cCI6MTk4OTAxODY4NX0.K-4_vzG_raKvY6LT8PRxFFnZDdZdmayCSU02XRB3B6g')

// Server Check
let supabase: SupabaseClient | null = null
let activeSupaUrl: Ref<string | null> = ref(null)
let activeSupaKey: Ref<string | null> = ref(null)
const tableNames: Ref<DatabaseTable[]> = ref([])

// Server Check Status
const isCheckInProgress: Ref<boolean> = ref(false)
const isRetrievingSchema: Ref<boolean> = ref(false)
const isSchemaAccessBlocked: Ref<boolean> = ref(false)
const isCheckComplete: Ref<boolean> = ref(false)
const isCurrentlyChecking: Ref<CheckType | null> = ref(null)
const errorMessage: Ref<string | null> = ref(null)

function resetCheckStatus() {
  isCheckInProgress.value = false
  isRetrievingSchema.value = false
  isSchemaAccessBlocked.value = false
  isCheckComplete.value = false
  isCurrentlyChecking.value = null
  errorMessage.value = null
}

async function doSupaCheck() {
  if (isCheckInProgress.value || !supaUrl.value || !supaKey.value) return
  activeSupaUrl.value = supaUrl.value.replace(/\/$/, '')
  activeSupaKey.value = supaKey.value
  supabase = createClient(activeSupaUrl.value, activeSupaKey.value)
  resetCheckStatus()
  isCheckInProgress.value = true
  isRetrievingSchema.value = true
  const { data, error } = await getDatabaseSchema(activeSupaUrl.value, activeSupaKey.value)
  isRetrievingSchema.value = false
  if (data) {
    tableNames.value = data
    await checkReadAccess()
    await checkInsertAccess()
    await checkUpdateAccess()
    await checkDeleteAccess()
    isCurrentlyChecking.value = null
    isCheckComplete.value = true
  }
  else {
    isCurrentlyChecking.value = null
    isSchemaAccessBlocked.value = true
    isCheckComplete.value = true
    errorMessage.value = error || 'Error fetching tables'
  }
}

async function checkReadAccess() {
  if (!supabase) return
  isCurrentlyChecking.value = 'read'
  for (const tn of tableNames.value) {
    tn.read = await checkReadAccessOnTable(supabase, tn)
    if (tn.read === null) tn.read = 'unlikely'
  }
}

async function checkInsertAccess() {
  if (!supabase) return
  isCurrentlyChecking.value = 'insert'
  for (const tn of tableNames.value) {
    tn.insertedRecord = await checkInsertAccessOnTable(supabase, tn)
    if (tn.insertedRecord) tn.insert = true
    else tn.insert = false
  }
}

async function checkUpdateAccess() {
  if (!supabase) return
  isCurrentlyChecking.value = 'update'
  for (const tn of tableNames.value) {
    tn.update = await checkUpdateAccessOnTable(supabase, tn)
  }
}

async function checkDeleteAccess() {
  if (!supabase) return
  isCurrentlyChecking.value = 'delete'
  for (const tn of tableNames.value) {
    tn.delete = await checkDeleteAccessOnTable(supabase, tn)
  }
}


function goBack() {
  resetCheckStatus()
}

async function check(tn: DatabaseTable, action: CheckType) {
  if (isCurrentlyChecking.value || !supabase) return
  if (action === 'read') tn.read = await checkReadAccessOnTable(supabase, tn)
  if (action === 'insert') {
    tn.insertedRecord = await checkInsertAccessOnTable(supabase, tn)
    if (tn.insertedRecord) tn.insert = true
    else tn.insert = false
  }
  if (action === 'update' && tn.insertedRecord) tn.update = await checkUpdateAccessOnTable(supabase, tn)
  if (action === 'delete') tn.delete = await checkDeleteAccessOnTable(supabase, tn)
}
</script>

<template>
  <div class="page">

    <div class="text-h3 text-center text-white q-mb-sm">
      SupaSecureCheck
    </div>
    <div class="text-center text-white text-body1 q-mb-lg">
      Check your Supabase RLS policy settings
    </div>

    <!-- Not Checking -->
    <div v-if="!isCheckInProgress && !isCheckComplete">
      <div style="max-width: 540px; margin: 0 auto 32px auto;">
        <q-form ref="updateProfileForm" greedy @submit="doSupaCheck" class="text-center"
          style="max-width: 400px; margin: 0 auto;">
          <q-input v-model="supaUrl" label="Supabase URL" filled dark
            :rules="[(val: string | null) => val && val.length > 0 || 'Required']" lazy-rules="ondemand" />
          <q-input v-model="supaKey" label="Supabase Anon Key" filled dark
            :rules="[(val: string | null) => val && val.length > 0 || 'Required']" lazy-rules="ondemand" />

          <q-btn label="Check" type="submit" color="primary" unelevated rounded class="full-width"
            :disable="isCheckInProgress" />
        </q-form>
      </div>
      <Instructions />
    </div>
    <!-- Checking -->
    <div v-else class="q-mt-lg">

      <!-- If Schema Access was Blocked -->
      <template v-if="isSchemaAccessBlocked">
        <SchemaBlocked />
        <div class="text-center">
          <q-btn label="Back" color="white" class="text-black q-mt-md" @click="goBack()" unelevated
            :disable="isCheckInProgress" icon="arrow_back" />
        </div>
      </template>

      <template v-else>

        <!-- Getting Tables -->
        <div class="text-center q-mb-lg" v-if="!isCheckComplete">
          <q-spinner size="50px" color="white" />
          <div class="text-body1 text-white q-mt-md">
            <template v-if="isRetrievingSchema">Getting tables...</template>
            <template v-else-if="isCurrentlyChecking">Checking {{ isCurrentlyChecking }} access...</template>
          </div>

        </div>

        <div class="column q-gutter-lg q-mx-auto justify-center" style="max-width: 500px;">
          <Legend />

          <q-markup-table dark class="shadow-0" bordered dense>
            <thead>
              <tr>
                <th class="text-left"><span class="text-bold">Table</span></th>
                <th class="text-center"><span class="text-bold">Read</span></th>
                <th class="text-center"><span class="text-bold">Insert</span></th>
                <th class="text-center"><span class="text-bold">Update</span></th>
                <th class="text-center"><span class="text-bold">Delete</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tn in tableNames" :key="tn.name">
                <td class="text-left">{{ tn.name }}</td>
                <!-- Read -->
                <td class="text-center">
                  <AccessStatus :tn="tn" action="read" @click="check(tn, 'read')" />
                </td>
                <!-- Insert -->
                <td class="text-center">
                  <AccessStatus :tn="tn" action="insert" @click="check(tn, 'insert')" />
                </td>
                <!-- Update -->
                <td class="text-center">
                  <AccessStatus :tn="tn" action="update" @click="check(tn, 'update')" />
                </td>
                <!-- Delete -->
                <td class="text-center">
                  <AccessStatusIcon :tn="tn" action="delete" style="cursor: default" />
                </td>
              </tr>
            </tbody>
          </q-markup-table>

          <div class="text-center">
            <q-btn label="Back" color="primary" rounded  @click="goBack()" unelevated
              :disable="!!isCurrentlyChecking" icon="arrow_back" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
$primary : #37996B;

.page {
  padding-top: 80px;
  background-color: #1C1C1C;
  min-height: 100vh;
}
</style>