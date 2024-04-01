<template>
  <q-markup-table dark dense flat  style="background-color: #232323; color: rgb(126, 126, 126);">
    <tbody>
      <tr>
        <td><q-icon name="warning" color="warning" size="xs" /></td>
        <td class="text-warning">Not Secured</td>
        <td><span class="text-caption">Anonymous users can use the operation on the table</span></td>
      </tr>
      <tr>
        <td><q-icon name="lock" color="positive" size="xs" /></td>
        <td class="text-positive">Secured</td>
        <td><span class="text-caption">Anonymous users cannot use the operation on the table</span></td>
      </tr>
      <tr>
        <td><q-icon name="lock" color="green-3" size="xs" /></td>
        <td class="text-green-3">Probably Secured</td>
        <td><span class="text-caption">Anonymous users can likely not use the operation on the table</span></td>
      </tr>
      <tr>
        <td><q-icon name="help" color="grey-5" size="xs" /></td>
        <td class="text-grey-5">Unknown</td>
        <td><span class="text-caption">Not checked</span></td>
      </tr>
    </tbody>
  </q-markup-table>
</template>