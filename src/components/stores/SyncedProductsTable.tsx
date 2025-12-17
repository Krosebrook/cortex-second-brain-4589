/**
 * SyncedProductsTable Component
 * Detailed table view for synced products with search, filtering, pagination, and export
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Package,
  ExternalLink,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStores } from '@/hooks/useStores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

interface SyncedProduct {
  id: string;
  store_id: string;
  external_id: string;
  title: string;
  description: string | null;
  vendor: string | null;
  product_type: string | null;
  status: string | null;
  tags: string[] | null;
  price_min: number | null;
  price_max: number | null;
  inventory_quantity: number | null;
  external_url: string | null;
  synced_at: string;
  created_at: string;
}

interface SyncedProductsTableProps {
  className?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function SyncedProductsTable({ className }: SyncedProductsTableProps) {
  const { stores, getSyncedProducts, loading } = useStores();
  
  const [products, setProducts] = useState<SyncedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Load products when store selection changes
  const loadProducts = useCallback(async (storeId: string) => {
    setIsLoading(true);
    try {
      if (storeId === 'all') {
        // Load from all stores
        const allProducts: SyncedProduct[] = [];
        for (const store of stores) {
          const storeProducts = await getSyncedProducts(store.id);
          if (storeProducts) {
            allProducts.push(...(storeProducts as SyncedProduct[]));
          }
        }
        setProducts(allProducts);
      } else {
        const storeProducts = await getSyncedProducts(storeId);
        setProducts((storeProducts as SyncedProduct[]) || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [stores, getSyncedProducts]);

  // Load products on mount and when store changes
  useEffect(() => {
    if (stores.length > 0) {
      loadProducts(selectedStoreId);
    }
  }, [stores.length, loadProducts, selectedStoreId]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const statuses = new Set<string>();
    const vendors = new Set<string>();
    
    products.forEach((product) => {
      if (product.status) statuses.add(product.status);
      if (product.vendor) vendors.add(product.vendor);
    });
    
    return {
      statuses: Array.from(statuses).sort(),
      vendors: Array.from(vendors).sort(),
    };
  }, [products]);

  // Filtered and paginated products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.title.toLowerCase().includes(query) ||
          product.external_id.toLowerCase().includes(query) ||
          product.vendor?.toLowerCase().includes(query) ||
          product.product_type?.toLowerCase().includes(query) ||
          product.tags?.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && product.status !== statusFilter) {
        return false;
      }
      
      // Vendor filter
      if (vendorFilter !== 'all' && product.vendor !== vendorFilter) {
        return false;
      }
      
      return true;
    });
  }, [products, searchQuery, statusFilter, vendorFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, vendorFilter, selectedStoreId]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedProducts(newSelection);
  };

  // Export functions
  const exportToCSV = (productsToExport: SyncedProduct[]) => {
    const headers = [
      'ID', 'External ID', 'Title', 'Vendor', 'Type', 'Status', 
      'Price Min', 'Price Max', 'Inventory', 'Tags', 'Last Synced'
    ];
    
    const rows = productsToExport.map(p => [
      p.id,
      p.external_id,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      p.vendor || '',
      p.product_type || '',
      p.status || '',
      p.price_min?.toString() || '',
      p.price_max?.toString() || '',
      p.inventory_quantity?.toString() || '',
      `"${(p.tags || []).join(', ')}"`,
      new Date(p.synced_at).toISOString(),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synced-products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: `Exported ${productsToExport.length} products to CSV`,
    });
  };

  const exportToJSON = (productsToExport: SyncedProduct[]) => {
    const blob = new Blob([JSON.stringify(productsToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synced-products-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: `Exported ${productsToExport.length} products to JSON`,
    });
  };

  const handleStoreChange = (value: string) => {
    setSelectedStoreId(value);
    loadProducts(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setVendorFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || vendorFilter !== 'all';

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle>Synced Products</CardTitle>
            <Badge variant="secondary">{filteredProducts.length}</Badge>
          </div>
          
          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportToCSV(filteredProducts)}>
                Export All ({filteredProducts.length}) as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToJSON(filteredProducts)}>
                Export All ({filteredProducts.length}) as JSON
              </DropdownMenuItem>
              {selectedProducts.size > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportToCSV(
                    filteredProducts.filter(p => selectedProducts.has(p.id))
                  )}>
                    Export Selected ({selectedProducts.size}) as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToJSON(
                    filteredProducts.filter(p => selectedProducts.has(p.id))
                  )}>
                    Export Selected ({selectedProducts.size}) as JSON
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Store Select */}
          <Select value={selectedStoreId} onValueChange={handleStoreChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.store_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={cn(hasActiveFilters && 'border-primary')}>
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {filterOptions.statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Vendor</label>
                  <Select value={vendorFilter} onValueChange={setVendorFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {filterOptions.vendors.map((vendor) => (
                        <SelectItem key={vendor} value={vendor}>
                          {vendor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery('')} />
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Status: {statusFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter('all')} />
              </Badge>
            )}
            {vendorFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Vendor: {vendorFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setVendorFilter('all')} />
              </Badge>
            )}
          </div>
        )}
        
        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={paginatedProducts.length > 0 && selectedProducts.size === paginatedProducts.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Vendor</TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Stock</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    {products.length === 0 
                      ? 'No products synced yet. Connect a store and sync to see products.'
                      : 'No products match your filters.'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleSelect(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1">{product.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ID: {product.external_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {product.vendor || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {product.product_type || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {product.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.price_min !== null ? (
                        product.price_min === product.price_max ? (
                          <span>${product.price_min.toFixed(2)}</span>
                        ) : (
                          <span>
                            ${product.price_min.toFixed(2)} - ${product.price_max?.toFixed(2)}
                          </span>
                        )
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {product.inventory_quantity ?? '-'}
                    </TableCell>
                    <TableCell>
                      {product.external_url && (
                        <a
                          href={product.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredProducts.length)} of {filteredProducts.length}
            </span>
            <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SyncedProductsTable;
