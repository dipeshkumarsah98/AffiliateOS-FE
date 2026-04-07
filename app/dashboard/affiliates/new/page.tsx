'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import * as z from 'zod'
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    ChevronRight,
    Info,
    Link2,
    RefreshCw,
    Search,
    User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Topbar } from '@/components/layout/Topbar'
import { VendorSelector } from '@/components/dashboard/affiliates/VendorSelector'

import { useAuthStore } from '@/stores/auth-store'
import { useProductsQuery } from '@/hooks/use-products'
import { useAffiliateDetail, useGenerateAffiliateCode } from '@/hooks/use-affiliates'
import type { AffiliateFormData } from '@/lib/affiliate-form-store'
import {
    loadFormDraft,
    saveFormDraft,
} from '@/lib/affiliate-form-store'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { Address } from '@/lib/api/orders'

// Validation schema
const affiliateFormSchema = z.object({
    vendorMode: z.enum(['existing', 'new']),
    vendorId: z.string().optional(),
    draftVendorInfo: z.any().optional(),
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Enter a valid email address'),
    affiliateType: z.enum(['influencer', 'reseller', 'referral', 'partner']),
    contactNumber: z.string(),
    streetAddress: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    selectedProductId: z.string().min(1, 'Please select a product'),
    affiliateCode: z.string().min(1, 'Affiliate code is required'),
    discountType: z.enum(['fixed', 'percentage']),
    discountValue: z.string().refine(
        (val) => {
            const num = Number(val)
            return !isNaN(num) && num >= 0
        },
        { message: 'Must be a valid number >= 0' }
    ),
    commissionType: z.enum(['fixed', 'percentage']),
    commissionValue: z.string().refine(
        (val) => {
            const num = Number(val)
            return !isNaN(num) && num >= 0
        },
        { message: 'Must be a valid number >= 0' }
    ),
    bankName: z.string(),
    accountNumber: z.string(),
    editId: z.string().optional(),
}).refine(
    (data) => data.vendorMode === 'new' || (data.vendorMode === 'existing' && data.vendorId),
    { message: 'Please select a vendor', path: ['vendorId'] }
)

type FormValues = z.infer<typeof affiliateFormSchema>

function toNonNegativeString(value: string) {
    if (value === '') return ''
    const parsed = Number(value)
    if (Number.isNaN(parsed)) return ''
    return String(Math.max(0, parsed))
}

const DEFAULT_FORM_VALUES: FormValues = {
    vendorMode: 'new',
    vendorId: undefined,
    draftVendorInfo: undefined,
    fullName: '',
    email: '',
    affiliateType: 'influencer' as const,
    contactNumber: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    selectedProductId: '',
    affiliateCode: '',
    discountType: 'fixed' as const,
    discountValue: '',
    commissionType: 'percentage' as const,
    commissionValue: '',
    bankName: '',
    accountNumber: '',
    editId: undefined,
}

function selectAddressFromUserAddresses(addresses: Address[]) {
    return addresses.find(a => a.addressType === 'billing') ?? addresses[0] ?? null
}

export default function NewAffiliatePage() {
    const currentUser = useAuthStore((s) => s.currentUser)
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('editId')

    const [productSearch, setProductSearch] = useState('')

    // Fetch products from backend
    const productsQuery = useProductsQuery({
        page: 1,
        limit: 1000,
        search: productSearch.trim() || undefined,
    })

    // Fetch existing affiliate data for edit mode
    const { data: existingAffiliate, isLoading: isLoadingAffiliate } = useAffiliateDetail(editId)
    const isEdit = Boolean(editId)

    // Hook for generating affiliate code from backend
    const generateCodeMutation = useGenerateAffiliateCode()

    // Initialize form with default values
    const form = useForm<FormValues>({
        resolver: zodResolver(affiliateFormSchema),
        defaultValues: (() => {
            const draft = loadFormDraft()
            if (draft && draft.editId === editId) {
                return {
                    ...DEFAULT_FORM_VALUES,
                    ...draft,
                }
            }
            return DEFAULT_FORM_VALUES
        })(),
    })

    const discountType = form.watch('discountType')
    const commissionType = form.watch('commissionType')
    const selectedProductId = form.watch('selectedProductId')

    // Redirect non-admin users
    useEffect(() => {
        if (currentUser && !currentUser.roles.includes('admin')) {
            router.replace('/dashboard')
        }
    }, [currentUser, router])

    // Restore draft data when navigating back from review page (create mode only)
    useEffect(() => {
        if (!editId) {
            const draft = loadFormDraft()
            if (draft && !draft.editId) {
                form.reset({
                    ...DEFAULT_FORM_VALUES,
                    vendorMode: draft.vendorMode ?? 'new',
                    vendorId: draft.vendorId,
                    draftVendorInfo: draft.draftVendorInfo,
                    fullName: draft.fullName,
                    email: draft.email,
                    affiliateType: draft.affiliateType,
                    contactNumber: draft.contactNumber,
                    streetAddress: draft.streetAddress,
                    city: draft.city,
                    state: draft.state,
                    postalCode: draft.postalCode,
                    selectedProductId: draft.selectedProductId,
                    affiliateCode: draft.affiliateCode,
                    discountType: draft.discountType,
                    discountValue: draft.discountValue,
                    commissionType: draft.commissionType,
                    commissionValue: draft.commissionValue,
                    bankName: draft.bankName,
                    accountNumber: draft.accountNumber,
                    editId: undefined,
                })
            }
        }
    }, [editId, form])

    // Load existing affiliate data for edit mode
    useEffect(() => {
        if (existingAffiliate && editId) {
            const draft = loadFormDraft()
            if (draft && draft.editId === editId) {
                form.reset({
                    ...DEFAULT_FORM_VALUES,
                    vendorMode: draft.vendorMode ?? 'new',
                    vendorId: draft.vendorId,
                    draftVendorInfo: draft.draftVendorInfo,
                    fullName: draft.fullName,
                    email: draft.email,
                    affiliateType: draft.affiliateType,
                    contactNumber: draft.contactNumber,
                    streetAddress: draft.streetAddress,
                    city: draft.city,
                    state: draft.state,
                    postalCode: draft.postalCode,
                    selectedProductId: draft.selectedProductId,
                    affiliateCode: draft.affiliateCode,
                    discountType: draft.discountType,
                    discountValue: draft.discountValue,
                    commissionType: draft.commissionType,
                    commissionValue: draft.commissionValue,
                    bankName: draft.bankName,
                    accountNumber: draft.accountNumber,
                    editId: editId ?? undefined,
                })
                return
            }

            const affiliateTypeMap: Record<string, 'influencer' | 'reseller' | 'referral' | 'partner'> = {
                INFLUENCER: 'influencer',
                RESELLER: 'reseller',
                REFERRAL: 'referral',
                PARTNER: 'partner',
            }

            const discountTypeMap: Record<string, 'fixed' | 'percentage'> = {
                FIXED: 'fixed',
                PERCENTAGE: 'percentage',
            }

            const selectedAddress = selectAddressFromUserAddresses(existingAffiliate.vendor.addresses)

            form.reset({
                ...DEFAULT_FORM_VALUES,
                vendorMode: 'new',
                fullName: existingAffiliate.vendor.name,
                email: existingAffiliate.vendor.email,
                affiliateType: affiliateTypeMap[existingAffiliate.vendor.extras.affiliateType] || 'influencer',
                contactNumber: existingAffiliate.vendor.phone || '',
                streetAddress: selectedAddress?.street_address || '',
                city: selectedAddress?.city || '',
                state: selectedAddress?.state || '',
                postalCode: selectedAddress?.postal_code || '',
                selectedProductId: existingAffiliate.productId,
                affiliateCode: existingAffiliate.code,
                discountType: discountTypeMap[existingAffiliate.discountType] || 'fixed',
                discountValue: String(existingAffiliate.discountValue),
                commissionType: discountTypeMap[existingAffiliate.commissionType] || 'percentage',
                commissionValue: String(existingAffiliate.commissionValue),
                bankName: existingAffiliate.vendor.extras.bankName,
                accountNumber: existingAffiliate.vendor.extras.accountNumber,
                editId: editId ?? undefined,
            })
        }
    }, [existingAffiliate, editId, form])

    async function regenerateCode() {
        try {
            const result = await generateCodeMutation.mutateAsync()
            form.setValue('affiliateCode', result.code, {
                shouldValidate: true,
            })
            toast.success('Affiliate code generated')
        } catch (error) {
            console.error('Failed to generate code:', error)
            toast.error(getApiErrorMessage(error, 'Failed to generate code'))
        }
    }

    function selectProduct(id: string) {
        form.setValue('selectedProductId', id, { shouldValidate: true })
    }

    const products = productsQuery.data?.items ?? []
    const isLoadingProducts = productsQuery.isLoading
    const isSearchingProducts = productsQuery.isFetching && !productsQuery.isLoading

    // Determine if bank details are auto-filled from vendor (read-only)

    function onSubmit(data: FormValues) {
        const formData: AffiliateFormData = {
            vendorMode: data.vendorMode,
            vendorId: data.vendorId,
            draftVendorInfo: data.draftVendorInfo,
            fullName: data.fullName,
            email: data.email,
            affiliateType: data.affiliateType,
            contactNumber: data.contactNumber,
            streetAddress: data.streetAddress,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            selectedProductId: data.selectedProductId,
            affiliateCode: data.affiliateCode,
            discountType: data.discountType,
            discountValue: data.discountValue,
            commissionType: data.commissionType,
            commissionValue: data.commissionValue,
            bankName: data.bankName,
            accountNumber: data.accountNumber,
            editId: editId ?? undefined,
        }
        saveFormDraft(formData)
        router.push('/dashboard/affiliates/new/review')
    }

    return (
        <div className="flex flex-col min-h-screen bg-background placeholder:text-gray-400">
            <Topbar title={isEdit ? 'Edit Affiliate' : 'New Affiliate'} />

            <main className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs mb-6 text-muted-foreground">
                    <Button
                        type="button"
                        variant="link"
                        onClick={() => router.push('/dashboard/affiliates')}
                        className="h-auto p-0 text-muted-foreground"
                    >
                        Affiliates
                    </Button>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-primary">
                        {isEdit ? 'Edit Affiliate' : 'Create New Affiliate'}
                    </span>
                </div>

                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">
                        {isEdit ? 'Edit Affiliate' : 'Register Affiliate'}
                    </h1>
                    <p className="text-sm mt-1 text-muted-foreground">
                        {isEdit
                            ? 'Update partner profile and commission structure.'
                            : 'Configure a new partner profile and commission structure.'}
                    </p>
                </div>

                {/* Loading state for edit mode */}
                {isEdit && isLoadingAffiliate && (
                    <div className="flex items-center justify-center py-20">
                        <Spinner className="w-8 h-8 text-primary" />
                        <span className="ml-3 text-sm text-muted-foreground">Loading affiliate data...</span>
                    </div>
                )}

                {/* Info banner for edit mode */}
                {isEdit && !isLoadingAffiliate && (
                    <Alert className="mb-6">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Vendor details cannot be updated after creation. Only affiliate settings (product, code, discounts, commissions) can be modified.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form */}
                {!isLoadingAffiliate && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Vendor Selection (create mode) / Read-only Personal Details (edit mode) */}
                            {isEdit ? (
                                /* Edit mode: show read-only personal details */
                                <Card className="shadow-sm bg-muted hover:cursor-not-allowed">
                                    <CardHeader className="border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Personal Details</CardTitle>
                                                <CardDescription className="text-xs mt-0.5">
                                                    Identification and contact information.
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="fullName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name *</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Ram Bahadur" {...field} disabled />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email Address *</FormLabel>
                                                        <FormControl>
                                                            <Input type="email" placeholder="ram@example.com.np" {...field} disabled />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="affiliateType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Affiliate Type</FormLabel>
                                                        <Select value={field.value} onValueChange={field.onChange} disabled>
                                                            <FormControl>
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue className='placeholder:text-gray-400' placeholder="Select affiliate type" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="influencer">Influencer</SelectItem>
                                                                <SelectItem value="reseller">Reseller</SelectItem>
                                                                <SelectItem value="referral">Referral</SelectItem>
                                                                <SelectItem value="partner">Partner</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="contactNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Contact Number</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="+977 9800000000" {...field} disabled />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="streetAddress"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Street Address</FormLabel>
                                                    <FormControl>
                                                        <Textarea rows={2} className="resize-none" {...field} disabled />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField control={form.control} name="city" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>City</FormLabel>
                                                    <FormControl><Input {...field} disabled /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="state" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>State / Province</FormLabel>
                                                    <FormControl><Input {...field} disabled /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="postalCode" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Postal Code</FormLabel>
                                                    <FormControl><Input {...field} disabled /></FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                /* Create mode: show VendorSelector with tab-based new/existing */
                                <VendorSelector form={form} />
                            )}

                            {/* Affiliate Details Section */}
                            <Card className="shadow-sm">
                                <CardHeader className="border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                            <Link2 className="w-5 h-5 text-emerald-700" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Affiliate Details</CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                Product linking and commercial terms.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-5">
                                    {/* Product Selection */}
                                    <div className="space-y-2">
                                        <Label>Product Selection</Label>
                                        <div className="rounded-lg border bg-card overflow-hidden">
                                            <div className="flex items-center gap-2 px-3 py-2.5 border-b">
                                                <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
                                                <Input
                                                    value={productSearch}
                                                    onChange={(e) => setProductSearch(e.target.value)}
                                                    placeholder="Search for products to link..."
                                                    className="flex-1 text-sm bg-transparent border-0 shadow-none px-0 focus-visible:ring-0 placeholder:text-gray-400"
                                                />
                                                {isSearchingProducts && (
                                                    <Spinner className="w-4 h-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="max-h-40 overflow-y-auto p-2 space-y-1">
                                                {isLoadingProducts ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Spinner className="w-6 h-6 text-primary" />
                                                        <span className="ml-2 text-sm text-muted-foreground">
                                                            Loading products...
                                                        </span>
                                                    </div>
                                                ) : products?.length === 0 ? (
                                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                                        {productSearch
                                                            ? 'No products found matching your search.'
                                                            : 'No products available.'}
                                                    </div>
                                                ) : (
                                                    products?.map((product) => {
                                                        const isSelected = selectedProductId === product.id
                                                        return (
                                                            <div
                                                                key={product.id}
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={() => selectProduct(product.id)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                                        e.preventDefault()
                                                                        selectProduct(product.id)
                                                                    }
                                                                }}
                                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors hover:bg-accent ${isSelected ? 'bg-primary/10' : ''
                                                                    }`}
                                                            >
                                                                {isSelected ? (
                                                                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                                                ) : (
                                                                    <div className="w-4 h-4 rounded-full border border-input shrink-0" />
                                                                )}
                                                                <span className="truncate flex-1">{product.title}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    Rs. {product.price.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        )
                                                    })
                                                )}
                                            </div>
                                        </div>
                                        {selectedProductId && (
                                            <p className="text-xs text-muted-foreground mt-1.5">
                                                1 product selected
                                            </p>
                                        )}
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="affiliateCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Affiliate Code *</FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            {...field}
                                                            placeholder="KTM-PARTNER-2026"
                                                            className="flex-1 placeholder:text-gray-400 font-mono uppercase"
                                                            onChange={(e) =>
                                                                field.onChange(e.target.value.toUpperCase())
                                                            }
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={regenerateCode}
                                                            title="Regenerate code"
                                                            disabled={generateCodeMutation.isPending}
                                                        >
                                                            {generateCodeMutation.isPending ? (
                                                                <Spinner className="w-4 h-4" />
                                                            ) : (
                                                                <RefreshCw className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Discount & Commission Configuration */}
                                    <div className="rounded-xl border bg-muted/20 p-5 space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative">
                                            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

                                            {/* Discount Configuration */}
                                            <div className="space-y-5">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-foreground">Customer Discount</h4>
                                                        <p className="text-xs text-muted-foreground mt-1">What the referred buyer receives</p>
                                                    </div>
                                                    <div className="flex items-center bg-background border rounded-lg p-1 shadow-sm">
                                                        {(['fixed', 'percentage'] as const).map((type) => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => form.setValue('discountType', type)}
                                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${discountType === type
                                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                                                    }`}
                                                            >
                                                                {type === 'fixed' ? 'Fixed (Rs)' : 'Percent (%)'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="discountValue"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="sr-only">Discount Value</FormLabel>
                                                            <FormControl>
                                                                <div className="relative flex items-center">
                                                                    <div className="absolute text-xs left-3 text-muted-foreground font-medium">
                                                                        {discountType === 'fixed' ? 'Rs ' : '%'}
                                                                    </div>
                                                                    <Input
                                                                        {...field}
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        placeholder='5'
                                                                        className="pl-8 h-11 text-lg font-medium"
                                                                        onChange={(e) =>
                                                                            field.onChange(
                                                                                toNonNegativeString(e.target.value)
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            {/* Commission Configuration */}
                                            <div className="space-y-5">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-emerald-600">Partner Commission</h4>
                                                        <p className="text-xs text-muted-foreground mt-1">What the affiliate earns per sale</p>
                                                    </div>
                                                    <div className="flex items-center bg-background border rounded-lg p-1 shadow-sm">
                                                        {(['fixed', 'percentage'] as const).map((type) => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => form.setValue('commissionType', type)}
                                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${commissionType === type
                                                                    ? 'bg-emerald-600 text-white shadow-sm'
                                                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                                                    }`}
                                                            >
                                                                {type === 'fixed' ? 'Fixed (Rs)' : 'Percent (%)'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="commissionValue"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="sr-only">Commission Value</FormLabel>
                                                            <FormControl>
                                                                <div className="relative flex items-center">
                                                                    <div className="absolute text-xs left-3 text-emerald-600 font-medium">
                                                                        {commissionType === 'fixed' ? 'Rs' : '%'}
                                                                    </div>
                                                                    <Input
                                                                        {...field}
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        placeholder='5'
                                                                        className="pl-8 h-11 text-lg font-medium border-emerald-200 focus-visible:ring-emerald-500"
                                                                        onChange={(e) =>
                                                                            field.onChange(
                                                                                toNonNegativeString(e.target.value)
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bank Details Section */}
                            {/* add bg-muted if in edit mode */}

                            <Card className={`shadow-sm ${isEdit ? 'bg-muted hover:cursor-not-allowed' : ''}`}>
                                <CardHeader className="border-b">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                            <Building2 className="w-5 h-5 text-amber-700" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Bank Details</CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                Payout information for commission settlements.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="bankName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bank Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. Global IME Bank"
                                                            {...field}
                                                            disabled={isEdit}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="accountNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Account Number</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. 0010000000000"
                                                            {...field}
                                                            disabled={isEdit}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Form Actions */}
                            <div className="flex items-center justify-between pt-2 pb-8">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => router.push('/dashboard/affiliates')}
                                    className="flex items-center gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                >
                                    {isEdit ? 'Review Changes' : 'Create Affiliate & Link'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </main>
        </div>
    )
}
