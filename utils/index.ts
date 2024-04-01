export type DatabaseTable = {
  name: string
  read: boolean | null | 'unlikely'
  insert: boolean | null
  update: boolean | null
  delete: boolean | null
  required?: string[]
  properties: TableProperty[]
  primaryKey?: string
  insertedRecord?: object | null
  checking: CheckType | null
}

export type TableProperty = {
  enum?: string[]
  description: string
  format: string
  type: string
  items: {
    type: string
  }
}

export type CheckType = 'read' | 'insert' | 'update' | 'delete'

export async function getDatabaseSchema(supabaseURL: string, supabaseKey: string): Promise<{ data?: DatabaseTable[], error?: string }> {
  const result: DatabaseTable[] = []
  try {
    const res = await fetch(`${supabaseURL}/rest/v1/?apikey=${supabaseKey}`)
    if (!res.ok) {
      const e = await res.json()
      return { error: e.message }
    }
    const data = await res.json()
    Object.keys(data.definitions).forEach((k) => {
      const propertyKeys = Object.keys(data.definitions[k].properties)
      const foundPKProp = propertyKeys.map((pk) => {
        const prop = data.definitions[k].properties[pk]
        if (prop.description?.includes('<pk/>')) {
          return { name: pk, description: prop.description }
        }
      }).find((p) => p)
      result.push({
        name: k,
        read: null,
        insert: null,
        update: null,
        delete: null,
        required: data.definitions[k].required,
        properties: data.definitions[k].properties,
        primaryKey: foundPKProp?.name,
        checking: null
      })
    })
    return { data: result }
  } catch {
    return { error: 'Error fetching schema.' }
  }
}