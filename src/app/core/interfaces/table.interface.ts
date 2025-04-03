export interface THead {
    category: CategoryTHead[],
}

export interface CategoryTHead {
    category: string
    id: string
}

export interface THeadRes {
    category: CategoryTHeadRes[],
}

export interface CategoryTHeadRes {
    category: string
}



export interface TBody {
    product: ProductTBody[]
}

export interface ProductTBody {
    Product_ID: number,
    Name: string,
    Category: string,
    Price: number,
    Stock: number,
    Image: string,
    id: number,
}

export interface ProductTBodyRes {
    Product_ID: number,
    Name: string,
    Category: string,
    Price: number,
    Stock: number,
    Image: string,
    id: number,
}