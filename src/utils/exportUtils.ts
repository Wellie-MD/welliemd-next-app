interface Column {
    key: string
    label: string
    render?: (value: any, row: any) => React.ReactNode
  }

  export const exportToCSV = (data: any[], columns: Column[], filename: string) => {
    const csvContent = [
      // Header row
      columns.map(col => col.label).join(','),
      // Data rows
      ...data.map(row =>
        columns.map(col => {
          const value = row[col.key]
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value
        }).join(',')
      )
    ].join('\n')
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

export interface PaginatedResponse<T> {
  next: string | null
  results: T[]
}

export const fetchAllPaginatedResults = async <T>(
  fetchPage: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
  pageSize = 500
): Promise<T[]> => {
  const allResults: T[] = []
  let page = 1
  let hasNext = true

  while (hasNext) {
    const response = await fetchPage(page, pageSize)
    allResults.push(...response.results)
    hasNext = Boolean(response.next)
    page += 1
  }

  return allResults
}
