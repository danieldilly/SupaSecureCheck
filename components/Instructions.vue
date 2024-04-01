<template>
  <q-card class="q-ma-md" style="max-width: 400px; margin: 0 auto; background-color: #232323; color: rgb(126, 126, 126); border-radius: 16px;">
    <q-card-section class="q-py-sm  text-center">
      <div class="text-caption">
        <div class="text-subtitle1 q-mb-sm">SupaSecureCheck will:</div>
        <ul class="text-left" style="padding: 0 24px;">
          <li>Call the root PostgREST endpoint to get a list of tables</li>
          <li>Attempt to read from each table</li>
          <li>Attempt to insert to each table</li>
          <li>Attempt to update a record that was inserted</li>
          <li>Attempt to delete a record that was inserted</li>
          <li>Display an icon indicating the result of each operation</li>
        </ul>
      </div>
    </q-card-section>
  </q-card>
</template>