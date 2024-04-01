import { SupabaseClient } from '@supabase/supabase-js'

/** Attempts to insert a record into `table`. Returns the inserted `object` if able to insert, `null` if not able to insert */
export async function checkInsertAccessOnTable(supabaseClient: SupabaseClient, table: DatabaseTable): Promise<object | null> {
  table.checking = 'insert'
  const recordtoInsert = generateDatabaseTableRandomData(table)
  const { data, error } = await supabaseClient.from(table.name).insert(recordtoInsert).select().single()
  table.checking = null
  if (error) return null
  else return data
}

/** Attempts to read records from `table`. Returns `true` if able to read, `false` if not able to read, `null` if unable to determine */
export async function checkReadAccessOnTable(supabaseClient: SupabaseClient, table: DatabaseTable): Promise<boolean | null> {
  table.checking = 'read'
  const { data, error } = await supabaseClient.from(table.name).select('*')
  table.checking = null
  if (error) return false
  if (data && data.length === 0) return null
  else return true
}

/** Attempts to update the given `record` on `table`. Returns `true` if able to insert, `false` if not able to insert, and `null` if unable to determine the primary key */
export async function checkUpdateAccessOnTable(supabaseClient: SupabaseClient, table: DatabaseTable): Promise<boolean | null> {
  if (!table.primaryKey) return false
  if (!table.insertedRecord) return null
  table.checking = 'update'
  const { error } = await supabaseClient.from(table.name).update(table.insertedRecord).eq(table.primaryKey, table.insertedRecord[table.primaryKey as keyof typeof table.insertedRecord])
  table.checking = null
  if (error) return false
  else return true
}

/** Attempts to delete the given `record` on `table`. Returns `true` if able to delete, `false` if not able to delete, and `null` if unable to determine the primary key */
export async function checkDeleteAccessOnTable(supabaseClient: SupabaseClient, table: DatabaseTable): Promise<boolean | null> {
  if (!table.primaryKey) return false
  if (!table.insertedRecord) return null
  table.checking = 'delete'
  const { error } = await supabaseClient.from(table.name).delete().eq(table.primaryKey, table.insertedRecord[table.primaryKey as keyof typeof table.insertedRecord])
  table.checking = null
  if (error) return false
  else return true
}