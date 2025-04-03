export interface Sort {
    property: SortProperty | null,
    direction: SortDir
}

export type SortDir = 'asc' | 'desc'

export type SortProperty = "Name" | "Price" | "Category" | "Stock"