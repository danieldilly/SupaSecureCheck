export function generateDatabaseTableRandomData(DatabaseTable: DatabaseTable): any {
    const result: any = {}
    if (DatabaseTable.required) {
      DatabaseTable.required.forEach((requiredProperty) => {
        const propertyDefinition = DatabaseTable.properties[requiredProperty as keyof typeof DatabaseTable.properties] as TableProperty
        if (propertyDefinition.description?.includes('<pk/>')) {
          // skip this property
          return
        }
        if (propertyDefinition) {
          result[requiredProperty] = generateRandomValue(propertyDefinition)
        }
      })
    }
    return result
  }
  
  export function generateRandomValue(property: TableProperty): any {
    switch (property.type) {
      case 'string':
        if (property.enum && property.enum.length > 0) {
          return property.enum[Math.floor(Math.random() * property.enum.length)]
        } else if (property.format.includes('timestamp')) {
          return new Date().toISOString()
        } else {
          return Math.random().toString(36).substring(7)
        }
      case 'integer':
        return Math.floor(Math.random() * 100)
      case 'boolean':
        return Math.random() < 0.5
      case 'number':
        return Math.random() * 100
      case 'array':
        return [generateRandomValue({ ...property.items, type: property.items!.type } as TableProperty)]
      default:
        return null
    }
  }
  
  