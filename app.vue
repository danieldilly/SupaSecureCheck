<script setup lang="ts">
import { SupabaseClient, createClient } from '@supabase/supabase-js'

// User Inputs
const supaUrl: Ref<string | null> = ref(null)
const supaKey: Ref<string | null> = ref(null)

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
  // validate URL
  const urlRegex = new RegExp('https://[a-zA-Z0-9-]+.supabase.co')
  if (!urlRegex.test(supaUrl.value)) {
    errorMessage.value = 'Invalid Supabase URL'
    return
  }
  activeSupaUrl.value = supaUrl.value.replace(/\/$/, '')
  activeSupaKey.value = supaKey.value
  supabase = createClient(activeSupaUrl.value, activeSupaKey.value)
  resetCheckStatus()
  isCheckInProgress.value = true
  isRetrievingSchema.value = true
  const { data, error } = await getDatabaseSchema(activeSupaUrl.value, activeSupaKey.value)
  console.log('error is', error)
  console.log('data is', data)
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
    isCheckInProgress.value = false
    isCheckComplete.value = true
    if (error === 'OpenAPI mode disabled' || error === 'Invalid API key') isSchemaAccessBlocked.value = true
    else { isCheckComplete.value = false }
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
          <q-input v-model="supaUrl" label="Supabase URL" filled dark hide-bottom-space class="q-mb-md"
            :rules="[(val: string | null) => val && val.length > 0 || 'Required']" lazy-rules="ondemand" />
          <q-input v-model="supaKey" label="Supabase Anon Key" filled dark hide-bottom-space class="q-mb-md"
            :rules="[(val: string | null) => val && val.length > 0 || 'Required']" lazy-rules="ondemand" />

          <q-btn label="Check" type="submit" color="primary" unelevated rounded class="full-width"
            :disable="isCheckInProgress" />

            <div v-if="errorMessage" class="q-mt-md text-caption text-negative">
              {{ errorMessage }}
            </div>
        </q-form>
      </div>
      <Instructions />
          <!-- Icon Link to github repo -->
    <div class="text-center q-mt-lg q-mx-auto">
      <a href="https://github.com/danieldilly/SupaSecureCheck" target="_blank" class="text-white">
        <svg style="width: 32px; height: 32px;" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd"
            d="M8.5 2.22168C5.23312 2.22168 2.58496 4.87398 2.58496 8.14677C2.58496 10.7642 4.27962 12.9853 6.63026 13.7684C6.92601 13.8228 7.03366 13.6401 7.03366 13.4827C7.03366 13.3425 7.02893 12.9693 7.02597 12.4754C5.38041 12.8333 5.0332 11.681 5.0332 11.681C4.76465 10.996 4.37663 10.8139 4.37663 10.8139C3.83954 10.4471 4.41744 10.4542 4.41744 10.4542C5.01072 10.4956 5.32303 11.0647 5.32303 11.0647C5.85065 11.9697 6.70774 11.7082 7.04431 11.5568C7.09873 11.1741 7.25134 10.9132 7.42051 10.7654C6.10737 10.6157 4.72621 10.107 4.72621 7.83683C4.72621 7.19031 4.95689 6.66092 5.33486 6.24686C5.27394 6.09721 5.07105 5.49447 5.39283 4.67938C5.39283 4.67938 5.88969 4.51967 7.01947 5.28626C7.502 5.15466 7.99985 5.08763 8.5 5.08692C9.00278 5.08929 9.50851 5.15495 9.98113 5.28626C11.1103 4.51967 11.606 4.67879 11.606 4.67879C11.9289 5.49447 11.7255 6.09721 11.6651 6.24686C12.0437 6.66092 12.2732 7.19031 12.2732 7.83683C12.2732 10.1129 10.8897 10.6139 9.5724 10.7606C9.78475 10.9434 9.97344 11.3048 9.97344 11.8579C9.97344 12.6493 9.96634 13.2887 9.96634 13.4827C9.96634 13.6413 10.0728 13.8258 10.3733 13.7678C11.5512 13.3728 12.5751 12.6175 13.3003 11.6089C14.0256 10.6002 14.4155 9.38912 14.415 8.14677C14.415 4.87398 11.7663 2.22168 8.5 2.22168Z"
            fill="currentColor"></path>
        </svg>
      </a>
    </div>
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
            <q-btn label="Back" color="primary" rounded @click="goBack()" unelevated :disable="!!isCurrentlyChecking"
              icon="arrow_back" />
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