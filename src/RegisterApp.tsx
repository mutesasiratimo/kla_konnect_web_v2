import { useState, useEffect, useMemo, useRef } from 'react'
import PhoneInput from 'react-phone-number-input'
import Select from 'react-select'
import 'react-phone-number-input/style.css'
import './Register.css'
import { users as usersApi, revenueStreams, revenueCategories, revenueSubcategories, locations as locationsApi, stages as stagesApi } from './api'
import type { UserRead, RevenueCategoryRead, RevenueSubcategoryRead, LocationRead, StageRead } from './api/types'

type StepKey = 'operatorResidence' | 'ownerVehicle' | 'operation' | 'contact'

type OwnershipType = 'individual' | 'nonIndividual'
type IdType = 'nin' | 'passport' | 'tin' | 'brn'

function idTypeToApi(t: IdType): string {
  return t === 'nin' ? 'NIN' : t === 'passport' ? 'Passport' : t === 'tin' ? 'TIN' : 'BRN'
}

/** Generate a random temp password for new user creation (backend requires non-empty). User can reset via forgot-password. */
function generateTempPassword(): string {
  const a = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...a)).replace(/[/+=]/g, '').slice(0, 24)
}

const PLATFORM_OPTIONS = [
  'Uber',
  'SafeBoda',
  'Spesho',
  'Faras',
  'Bolt',
  'Yango',
]

const PURPOSE_OPTIONS = ['Transport services', 'Company Asset', 'Personal'] as const
type PurposeValue = (typeof PURPOSE_OPTIONS)[number] | ''

type RegisterStepperProps = {
  steps: { key: StepKey; label: string }[]
  activeStep: StepKey
  onStepChange: (step: StepKey) => void
}

function RegisterStepper({
  steps,
  activeStep,
  onStepChange,
}: RegisterStepperProps) {
  const currentIndex = steps.findIndex(
    (stepCandidate) => stepCandidate.key === activeStep,
  )

  return (
    <nav className="register-stepper" aria-label="Registration progress">
      <ol className="stepper-list">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isActive = index === currentIndex
          const stateClass = isActive
            ? 'stepper-item--active'
            : isCompleted
              ? 'stepper-item--completed'
              : 'stepper-item--upcoming'

          return (
            <li key={step.key} className={`stepper-item ${stateClass}`}>
              <button
                type="button"
                className="stepper-button"
                onClick={() => onStepChange(step.key)}
              >
                <span className="stepper-circle">
                  {isCompleted ? '✓' : index + 1}
                </span>
                <span className="stepper-label">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <span className="stepper-line" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export function RegisterApp() {
  const [activeStep, setActiveStep] = useState<StepKey>('operatorResidence')
  const [ownershipType, setOwnershipType] =
    useState<OwnershipType>('individual')
  const [idType, setIdType] = useState<IdType>('nin')
  const [idValue, setIdValue] = useState('')
  const [showIdSuggestions, setShowIdSuggestions] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')

  const [district, setDistrict] = useState('')
  const [county, setCounty] = useState('')
  const [subcounty, setSubcounty] = useState('')
  const [parish, setParish] = useState('')
  const [village, setVillage] = useState('')

  const [locationDistricts, setLocationDistricts] = useState<string[]>([])
  const [locationRows, setLocationRows] = useState<LocationRead[]>([])
  const [residenceCounties, setResidenceCounties] = useState<string[]>([])
  const [residenceSubcounties, setResidenceSubcounties] = useState<string[]>([])
  const [residenceParishes, setResidenceParishes] = useState<string[]>([])
  const [residenceVillages, setResidenceVillages] = useState<string[]>([])
  const [operatorCounties, setOperatorCounties] = useState<string[]>([])
  const [operatorSubcounties, setOperatorSubcounties] = useState<string[]>([])
  const [operatorParishes, setOperatorParishes] = useState<string[]>([])
  const [operatorVillages, setOperatorVillages] = useState<string[]>([])
  const [villageFilterRes, setVillageFilterRes] = useState('')
  const [showVillageDropdownRes, setShowVillageDropdownRes] = useState(false)
  const [villageSearchResResults, setVillageSearchResResults] = useState<LocationRead[]>([])
  const [villageSearchResLoading, setVillageSearchResLoading] = useState(false)
  const villageSearchResTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [villageFilterOp, setVillageFilterOp] = useState('')
  const [showVillageDropdownOp, setShowVillageDropdownOp] = useState(false)
  const [villageSearchOpResults, setVillageSearchOpResults] = useState<LocationRead[]>([])
  const [villageSearchOpLoading, setVillageSearchOpLoading] = useState(false)
  const villageSearchOpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [entityName, setEntityName] = useState('')

  // Contact person details (for non-individual ownership)
  const [contactIdType, setContactIdType] = useState<IdType>('nin')
  const [contactIdValue, setContactIdValue] = useState('')
  const [contactFirstName, setContactFirstName] = useState('')
  const [contactLastName, setContactLastName] = useState('')
  const [contactPhoneNumber, setContactPhoneNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  // Vehicle step
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleRegistration, setVehicleRegistration] = useState('')
  const [vehicleMakeModel, setVehicleMakeModel] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [vehicleVin, setVehicleVin] = useState('')
  const [ownerOperated, setOwnerOperated] = useState<'yes' | 'no' | ''>('')

  const [operatorIdType, setOperatorIdType] = useState<IdType>('nin')
  const [operatorIdValue, setOperatorIdValue] = useState('')
  const [operatorFirstName, setOperatorFirstName] = useState('')
  const [operatorLastName, setOperatorLastName] = useState('')
  const [operatorPhoneNumber, setOperatorPhoneNumber] = useState('')
  const [operatorEmail, setOperatorEmail] = useState('')

  // Operation step (stepper 3)
  const [purpose, setPurpose] = useState<PurposeValue>('')
  const [modeOfOperation, setModeOfOperation] = useState<
    'stage' | 'ePlatform' | 'both' | 'neither' | ''
  >('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [stageSearch, setStageSearch] = useState('')
  const [showStageSuggestions, setShowStageSuggestions] = useState(false)
  const [stageSearchResults, setStageSearchResults] = useState<StageRead[]>([])
  const [stageSearchLoading, setStageSearchLoading] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const stageSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [opDistrict, setOpDistrict] = useState('')
  const [opCounty, setOpCounty] = useState('')
  const [opSubcounty, setOpSubcounty] = useState('')
  const [opParish, setOpParish] = useState('')
  const [opVillage, setOpVillage] = useState('')

  const [showSummaryDialog, setShowSummaryDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showContactSuggestions, setShowContactSuggestions] = useState(false)
  const [showOperatorSuggestions, setShowOperatorSuggestions] = useState(false)

  // Live ID search (API)
  const [ownerSearchResults, setOwnerSearchResults] = useState<UserRead[]>([])
  const [ownerSearchLoading, setOwnerSearchLoading] = useState(false)
  const [contactSearchResults, setContactSearchResults] = useState<UserRead[]>([])
  const [contactSearchLoading, setContactSearchLoading] = useState(false)
  const [operatorSearchResults, setOperatorSearchResults] = useState<UserRead[]>([])
  const [operatorSearchLoading, setOperatorSearchLoading] = useState(false)
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const [_selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null)

  const [categories, setCategories] = useState<RevenueCategoryRead[]>([])
  const [vehicleSubcategories, setVehicleSubcategories] = useState<
    RevenueSubcategoryRead[]
  >([])
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const ownerSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contactSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const operatorSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced stage search (API) for operation step
  useEffect(() => {
    const q = stageSearch.trim()
    if (q.length < 2) {
      setStageSearchResults([])
      return
    }
    if (stageSearchTimeoutRef.current) clearTimeout(stageSearchTimeoutRef.current)
    stageSearchTimeoutRef.current = setTimeout(() => {
      setStageSearchLoading(true)
      stagesApi
        .search(q, 20)
        .then(setStageSearchResults)
        .catch(() => setStageSearchResults([]))
        .finally(() => setStageSearchLoading(false))
    }, 300)
    return () => {
      if (stageSearchTimeoutRef.current) clearTimeout(stageSearchTimeoutRef.current)
    }
  }, [stageSearch])

  // Load categories for submit (category_id mapping)
  useEffect(() => {
    revenueCategories.list().then(setCategories).catch(() => setCategories([]))
    revenueSubcategories.list().then(setVehicleSubcategories).catch(() => setVehicleSubcategories([]))
  }, [])

  const selectedVehicleSubcategory = useMemo(
    () => vehicleSubcategories.find((s) => s.id === vehicleType) ?? null,
    [vehicleSubcategories, vehicleType],
  )

  function sortLocationsFirst(items: string[], first: string[]): string[] {
    const copy = [...items]
    copy.sort((a, b) => {
      const aIdx = first.findIndex((p) => p.toLowerCase() === (a || '').toLowerCase())
      const bIdx = first.findIndex((p) => p.toLowerCase() === (b || '').toLowerCase())
      if (aIdx >= 0 && bIdx < 0) return -1
      if (bIdx >= 0 && aIdx < 0) return 1
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx
      return (a || '').localeCompare(b || '')
    })
    return copy
  }

  const uniqueSorted = (items: string[]): string[] =>
    sortLocationsFirst(
      Array.from(new Set(items.filter((v) => (v || '').trim() !== ''))),
      ['Kampala', 'Wakiso'],
    )

  // Load location districts on mount
  useEffect(() => {
    locationsApi
      .districts()
      .then(async (d) => {
        const sorted = uniqueSorted(d)
        if (sorted.length > 0) {
          setLocationDistricts(sorted)
          return
        }
        const rows = await locationsApi.all()
        setLocationRows(rows)
        setLocationDistricts(uniqueSorted(rows.map((r) => r.district)))
      })
      .catch(async () => {
        try {
          const rows = await locationsApi.all()
          setLocationRows(rows)
          setLocationDistricts(uniqueSorted(rows.map((r) => r.district)))
        } catch {
          setLocationDistricts([])
        }
      })
  }, [])

  // Load residence counties when district changes
  useEffect(() => {
    if (!district?.trim()) {
      setResidenceCounties([])
      return
    }
    const d = district.trim()
    locationsApi
      .counties(d)
      .then((c) => {
        const sorted = uniqueSorted(c)
        if (sorted.length > 0) {
          setResidenceCounties(sorted)
          return
        }
        setResidenceCounties(
          uniqueSorted(
            locationRows
              .filter((r) => r.district === d)
              .map((r) => r.county),
          ),
        )
      })
      .catch(() =>
        setResidenceCounties(
          uniqueSorted(
            locationRows
              .filter((r) => r.district === d)
              .map((r) => r.county),
          ),
        ),
      )
  }, [district, locationRows])

  // Load residence subcounties when county changes (GET /locations/subcounties/{county})
  useEffect(() => {
    if (!county?.trim()) {
      setResidenceSubcounties([])
      return
    }
    const c = county.trim()
    locationsApi
      .subcounties(c)
      .then((s) => {
        const sorted = uniqueSorted(s)
        if (sorted.length > 0) {
          setResidenceSubcounties(sorted)
          return
        }
        setResidenceSubcounties(
          uniqueSorted(
            locationRows
              .filter((r) => r.county === c)
              .map((r) => r.subcounty),
          ),
        )
      })
      .catch(() =>
        setResidenceSubcounties(
          uniqueSorted(
            locationRows
              .filter((r) => r.county === c)
              .map((r) => r.subcounty),
          ),
        ),
      )
  }, [county, locationRows])

  useEffect(() => {
    if (!subcounty?.trim()) {
      setResidenceParishes([])
      return
    }
    const selected = subcounty.trim()
    locationsApi
      .parishes(selected)
      .then((p) => {
        const sorted = uniqueSorted(p)
        if (sorted.length > 0) {
          setResidenceParishes(sorted)
          return
        }
        setResidenceParishes(
          uniqueSorted(
            locationRows
              .filter((r) => r.subcounty === selected)
              .map((r) => r.parish),
          ),
        )
      })
      .catch(() =>
        setResidenceParishes(
          uniqueSorted(
            locationRows
              .filter((r) => r.subcounty === selected)
              .map((r) => r.parish),
          ),
        ),
      )
  }, [subcounty, locationRows])

  useEffect(() => {
    if (!parish?.trim()) {
      setResidenceVillages([])
      return
    }
    const selected = parish.trim()
    locationsApi
      .villages(selected)
      .then((v) => {
        const sorted = uniqueSorted(v)
        if (sorted.length > 0) {
          setResidenceVillages(sorted)
          return
        }
        setResidenceVillages(
          uniqueSorted(
            locationRows
              .filter((r) => r.parish === selected)
              .map((r) => r.village),
          ),
        )
      })
      .catch(() =>
        setResidenceVillages(
          uniqueSorted(
            locationRows
              .filter((r) => r.parish === selected)
              .map((r) => r.village),
          ),
        ),
      )
  }, [parish, locationRows])

  // Load operator counties when opDistrict changes
  useEffect(() => {
    if (!opDistrict?.trim()) {
      setOperatorCounties([])
      return
    }
    const d = opDistrict.trim()
    locationsApi
      .counties(d)
      .then((c) => {
        const sorted = uniqueSorted(c)
        if (sorted.length > 0) {
          setOperatorCounties(sorted)
          return
        }
        setOperatorCounties(
          uniqueSorted(
            locationRows
              .filter((r) => r.district === d)
              .map((r) => r.county),
          ),
        )
      })
      .catch(() =>
        setOperatorCounties(
          uniqueSorted(
            locationRows
              .filter((r) => r.district === d)
              .map((r) => r.county),
          ),
        ),
      )
  }, [opDistrict, locationRows])

  // Load operator subcounties when opCounty changes (GET /locations/subcounties/{county})
  useEffect(() => {
    if (!opCounty?.trim()) {
      setOperatorSubcounties([])
      return
    }
    const c = opCounty.trim()
    locationsApi
      .subcounties(c)
      .then((s) => {
        const sorted = uniqueSorted(s)
        if (sorted.length > 0) {
          setOperatorSubcounties(sorted)
          return
        }
        setOperatorSubcounties(
          uniqueSorted(
            locationRows
              .filter((r) => r.county === c)
              .map((r) => r.subcounty),
          ),
        )
      })
      .catch(() =>
        setOperatorSubcounties(
          uniqueSorted(
            locationRows
              .filter((r) => r.county === c)
              .map((r) => r.subcounty),
          ),
        ),
      )
  }, [opCounty, locationRows])

  useEffect(() => {
    if (!opSubcounty?.trim()) {
      setOperatorParishes([])
      return
    }
    const selected = opSubcounty.trim()
    locationsApi
      .parishes(selected)
      .then((p) => {
        const sorted = uniqueSorted(p)
        if (sorted.length > 0) {
          setOperatorParishes(sorted)
          return
        }
        setOperatorParishes(
          uniqueSorted(
            locationRows
              .filter((r) => r.subcounty === selected)
              .map((r) => r.parish),
          ),
        )
      })
      .catch(() =>
        setOperatorParishes(
          uniqueSorted(
            locationRows
              .filter((r) => r.subcounty === selected)
              .map((r) => r.parish),
          ),
        ),
      )
  }, [opSubcounty, locationRows])

  useEffect(() => {
    if (!opParish?.trim()) {
      setOperatorVillages([])
      return
    }
    const selected = opParish.trim()
    locationsApi
      .villages(selected)
      .then((v) => {
        const sorted = uniqueSorted(v)
        if (sorted.length > 0) {
          setOperatorVillages(sorted)
          return
        }
        setOperatorVillages(
          uniqueSorted(
            locationRows
              .filter((r) => r.parish === selected)
              .map((r) => r.village),
          ),
        )
      })
      .catch(() =>
        setOperatorVillages(
          uniqueSorted(
            locationRows
              .filter((r) => r.parish === selected)
              .map((r) => r.village),
          ),
        ),
      )
  }, [opParish, locationRows])

  // When parish not selected: debounced village search via locations/search/villages (residence)
  useEffect(() => {
    if (parish?.trim()) {
      setVillageSearchResResults([])
      return
    }
    const q = villageFilterRes.trim()
    if (q.length < 2) {
      setVillageSearchResResults([])
      return
    }
    if (villageSearchResTimeoutRef.current) clearTimeout(villageSearchResTimeoutRef.current)
    villageSearchResTimeoutRef.current = setTimeout(() => {
      setVillageSearchResLoading(true)
      locationsApi
        .searchVillages(q, 20)
        .then(setVillageSearchResResults)
        .catch(() => setVillageSearchResResults([]))
        .finally(() => setVillageSearchResLoading(false))
    }, 300)
    return () => {
      if (villageSearchResTimeoutRef.current) clearTimeout(villageSearchResTimeoutRef.current)
    }
  }, [parish, villageFilterRes])

  // When opParish not selected: debounced village search via locations/search/villages (operator)
  useEffect(() => {
    if (opParish?.trim()) {
      setVillageSearchOpResults([])
      return
    }
    const q = villageFilterOp.trim()
    if (q.length < 2) {
      setVillageSearchOpResults([])
      return
    }
    if (villageSearchOpTimeoutRef.current) clearTimeout(villageSearchOpTimeoutRef.current)
    villageSearchOpTimeoutRef.current = setTimeout(() => {
      setVillageSearchOpLoading(true)
      locationsApi
        .searchVillages(q, 20)
        .then(setVillageSearchOpResults)
        .catch(() => setVillageSearchOpResults([]))
        .finally(() => setVillageSearchOpLoading(false))
    }, 300)
    return () => {
      if (villageSearchOpTimeoutRef.current) clearTimeout(villageSearchOpTimeoutRef.current)
    }
  }, [opParish, villageFilterOp])

  // Debounced live search for owner ID
  useEffect(() => {
    if (ownerSearchTimeoutRef.current) clearTimeout(ownerSearchTimeoutRef.current)
    const q = idValue.trim()
    if (q.length < 2) {
      setOwnerSearchResults([])
      return
    }
    ownerSearchTimeoutRef.current = setTimeout(() => {
      setOwnerSearchLoading(true)
      usersApi
        .search({ id_no: q, id_type: idTypeToApi(idType), limit: 20 })
        .then((list) => {
          setOwnerSearchResults(list)
        })
        .catch(() => setOwnerSearchResults([]))
        .finally(() => setOwnerSearchLoading(false))
    }, 300)
    return () => {
      if (ownerSearchTimeoutRef.current) clearTimeout(ownerSearchTimeoutRef.current)
    }
  }, [idValue, idType])

  // Debounced live search for contact ID
  useEffect(() => {
    if (contactSearchTimeoutRef.current) clearTimeout(contactSearchTimeoutRef.current)
    const q = contactIdValue.trim()
    if (q.length < 2) {
      setContactSearchResults([])
      return
    }
    contactSearchTimeoutRef.current = setTimeout(() => {
      setContactSearchLoading(true)
      usersApi
        .search({ id_no: q, id_type: idTypeToApi(contactIdType), limit: 20 })
        .then((list) => {
          setContactSearchResults(list)
        })
        .catch(() => setContactSearchResults([]))
        .finally(() => setContactSearchLoading(false))
    }, 300)
    return () => {
      if (contactSearchTimeoutRef.current) clearTimeout(contactSearchTimeoutRef.current)
    }
  }, [contactIdValue, contactIdType])

  // Debounced live search for operator ID
  useEffect(() => {
    if (operatorSearchTimeoutRef.current) clearTimeout(operatorSearchTimeoutRef.current)
    const q = operatorIdValue.trim()
    if (q.length < 2) {
      setOperatorSearchResults([])
      return
    }
    operatorSearchTimeoutRef.current = setTimeout(() => {
      setOperatorSearchLoading(true)
      usersApi
        .search({ id_no: q, id_type: idTypeToApi(operatorIdType), limit: 20 })
        .then((list) => {
          setOperatorSearchResults(list)
        })
        .catch(() => setOperatorSearchResults([]))
        .finally(() => setOperatorSearchLoading(false))
    }, 300)
    return () => {
      if (operatorSearchTimeoutRef.current) clearTimeout(operatorSearchTimeoutRef.current)
    }
  }, [operatorIdValue, operatorIdType])

  const isIndividual = ownershipType === 'individual'


  const steps: { key: StepKey; label: string }[] = isIndividual
    ? [
        { key: 'operatorResidence', label: 'Operator & residence' },
        { key: 'ownerVehicle', label: 'Owner & vehicle' },
        { key: 'operation', label: 'Operation & area' },
      ]
    : [
        { key: 'operatorResidence', label: 'Operator & residence' },
        { key: 'ownerVehicle', label: 'Owner & vehicle' },
        { key: 'operation', label: 'Operation & area' },
        { key: 'contact', label: 'Contact person' },
      ]

  const lastStep: StepKey = isIndividual ? 'operation' : 'contact'
  const isLastStep = activeStep === lastStep

  const handleSubmitOperatorResidence = (event: React.FormEvent) => {
    event.preventDefault()
    setActiveStep('ownerVehicle')
  }

  const handleSubmitOwnerVehicle = (event: React.FormEvent) => {
    event.preventDefault()
    setActiveStep('operation')
  }

  const handleSubmitOperation = (event: React.FormEvent) => {
    event.preventDefault()
    if (isIndividual) {
      // Individual flow: this is the final step, open confirm dialog with preview
      setShowSummaryDialog(true)
    } else {
      // Non-individual flow: proceed to contact person step
      setActiveStep('contact')
    }
  }

  const handleSubmitContact = (event: React.FormEvent) => {
    event.preventDefault()
    // Non-individual flow final step: open confirm dialog with preview
    setShowSummaryDialog(true)
  }

  const handleConfirmSubmit = async () => {
    setSubmitError(null)
    setSubmitLoading(true)
    try {
      const categoryId =
        selectedVehicleSubcategory?.category_id ??
        (categories.length > 0 ? categories[0].id : '')
      if (!categoryId) {
        setSubmitError('No vehicle category available. Please try again later.')
        return
      }
      if (!selectedVehicleSubcategory?.id) {
        setSubmitError('Please select a vehicle type.')
        return
      }
      const ownerFullName = isIndividual
        ? [firstName, lastName].filter(Boolean).join(' ')
        : entityName
      const ownerEmail = email?.trim()
      if (!ownerEmail) {
        setSubmitError('Owner email is required.')
        return
      }
      const operatorEmailTrimmed = operatorEmail?.trim()
      if (!operatorEmailTrimmed) {
        setSubmitError('Operator email is required.')
        return
      }
      await revenueStreams.onboard({
        name: vehicleRegistration || vehicleMakeModel || 'Vehicle',
        category_id: categoryId,
        subcategory_id: selectedVehicleSubcategory.id,
        reg_no: vehicleRegistration || undefined,
        vin: vehicleVin || undefined,
        color: vehicleColor || undefined,
        model: vehicleMakeModel || undefined,
        stage_id: selectedStageId ?? undefined,
        purpose: purpose || undefined,
        district: opDistrict || undefined,
        county: opCounty || undefined,
        subcounty: opSubcounty || undefined,
        parish: opParish || undefined,
        village: opVillage || undefined,
        owner: {
          ...(selectedOwnerId ? { id: selectedOwnerId } : {}),
          email: ownerEmail,
          password: selectedOwnerId ? undefined : generateTempPassword(),
          phone: phoneNumber || undefined,
          full_name: ownerFullName || undefined,
          id_type: idTypeToApi(idType),
          id_number: idValue || undefined,
          district: district || undefined,
          county: county || undefined,
          subcounty: subcounty || undefined,
          parish: parish || undefined,
          village: village || undefined,
        },
        primary_operator: {
          ...(selectedOperatorId ? { id: selectedOperatorId } : {}),
          email: operatorEmailTrimmed,
          password: selectedOperatorId ? undefined : generateTempPassword(),
          phone: operatorPhoneNumber || undefined,
          full_name: [operatorFirstName, operatorLastName].filter(Boolean).join(' ') || undefined,
          id_type: idTypeToApi(operatorIdType),
          id_number: operatorIdValue || undefined,
          district: district || undefined,
          county: county || undefined,
          subcounty: subcounty || undefined,
          parish: parish || undefined,
          village: village || undefined,
        },
      })
      setShowSummaryDialog(false)
      setShowSuccessDialog(true)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'body' in err
          ? JSON.stringify((err as { body: unknown }).body)
          : err instanceof Error
            ? err.message
            : 'Submission failed.'
      setSubmitError(message)
    } finally {
      setSubmitLoading(false)
    }
  }

  const selectStage = (stage: StageRead) => {
    setStageSearch(stage.display_name)
    setShowStageSuggestions(false)
    setSelectedStageId(stage.id)
    const d = stage.district ?? ''
    const c = stage.county ?? ''
    const s = stage.subcounty ?? ''
    const p = stage.parish ?? ''
    const v = stage.village ?? ''
    setOpDistrict(d)
    setOpCounty(c)
    setOpSubcounty(s)
    setOpParish(p)
    setOpVillage(v)
    if (d) setOperatorCounties((prev) => (prev.includes(c) ? prev : sortLocationsFirst([...prev, c], ['Kampala', 'Wakiso'])))
    if (c) setOperatorSubcounties((prev) => (prev.includes(s) ? prev : sortLocationsFirst([...prev, s], ['Kampala', 'Wakiso'])))
    if (s) setOperatorParishes((prev) => (prev.includes(p) ? prev : sortLocationsFirst([...prev, p], ['Kampala', 'Wakiso'])))
    if (p) setOperatorVillages((prev) => (prev.includes(v) ? prev : sortLocationsFirst([...prev, v], ['Kampala', 'Wakiso'])))
  }

  const selectOpVillageFromSearch = (loc: LocationRead) => {
    setOpDistrict(loc.district)
    setOpCounty(loc.county)
    setOpSubcounty(loc.subcounty)
    setOpParish(loc.parish)
    setOpVillage(loc.village)
    setVillageFilterOp('')
    setOperatorCounties((prev) => (prev.includes(loc.county) ? prev : sortLocationsFirst([...prev, loc.county], ['Kampala', 'Wakiso'])))
    setOperatorSubcounties((prev) => (prev.includes(loc.subcounty) ? prev : sortLocationsFirst([...prev, loc.subcounty], ['Kampala', 'Wakiso'])))
    setOperatorParishes((prev) => (prev.includes(loc.parish) ? prev : sortLocationsFirst([...prev, loc.parish], ['Kampala', 'Wakiso'])))
    setOperatorVillages((prev) => (prev.includes(loc.village) ? prev : sortLocationsFirst([...prev, loc.village], ['Kampala', 'Wakiso'])))
  }

  // When "Owner operated = Yes", keep operator in sync with owner (owner step comes after operator step)
  useEffect(() => {
    if (!isIndividual || ownerOperated !== 'yes') return
    setOperatorIdType(idType)
    setOperatorIdValue(idValue)
    setOperatorFirstName(firstName)
    setOperatorLastName(lastName)
    setOperatorPhoneNumber(phoneNumber)
    setOperatorEmail(email ?? '')
  }, [isIndividual, ownerOperated, idType, idValue, firstName, lastName, phoneNumber, email])

  return (
    <div className="register-root container-fluid">
      <div className="register-shell">
        <div className="register-card">
          <header className="register-header">
            {/* <div className="register-logo">
              <img src="/kcclogo.jpg" alt="Kla Konnect" />
            </div>
            <div className="register-heading">
              <h1>Self Registration</h1>
            </div> */}
          </header>

          <RegisterStepper
            steps={steps}
            activeStep={activeStep}
            onStepChange={setActiveStep}
          />

          {activeStep === 'operatorResidence' && (
            <form
              className="register-step mt-4"
              onSubmit={handleSubmitOperatorResidence}
              autoComplete="on"
            >
              <div className="row g-4">
                <section className="col-12 col-md-6">
                  <h2 className="column-title">Operator details</h2>
                  <div className="mb-3">
                    <label className="field-label">Ownership type</label>
                    <div className="select-shell">
                      <select
                        className="form-select custom-select"
                        value={ownershipType}
                        onChange={(event) => {
                          const value = event.target.value as OwnershipType
                          setOwnershipType(value)
                        }}
                      >
                        <option value="individual">Individual</option>
                        <option value="nonIndividual">Non-individual</option>
                      </select>
                    </div>
                  </div>
                  <div className="row g-3 mb-3 align-items-end">
                    <div className="col-12 col-sm-4">
                      <label className="field-label">ID type</label>
                      <div className="select-shell">
                        <select className="form-select custom-select" value={operatorIdType} onChange={(e) => setOperatorIdType(e.target.value as IdType)}>
                          <option value="nin">NIN</option>
                          <option value="passport">Passport No</option>
                          <option value="tin">TIN</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-12 col-sm-8">
                      <label className="field-label">
                        {operatorIdType === 'passport' ? 'Passport number' : operatorIdType === 'tin' ? 'TIN' : 'ID number'}
                      </label>
                      <div className="id-search-shell">
                        <i className="fa fa-search id-search-icon" aria-hidden="true" />
                        <input
                          type="text"
                          className="form-control id-search-input"
                          placeholder="Start typing to search (min 2 chars)..."
                          value={operatorIdValue}
                          onChange={(e) => {
                            setOperatorIdValue(e.target.value)
                            setSelectedOperatorId(null)
                            setShowOperatorSuggestions(true)
                          }}
                          onFocus={() => operatorIdValue.trim().length >= 2 && setShowOperatorSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowOperatorSuggestions(false), 200)}
                        />
                        {showOperatorSuggestions && (operatorSearchLoading || operatorSearchResults.length > 0) && (
                          <ul className="id-suggestion-list">
                            {operatorSearchLoading ? (
                              <li className="id-suggestion-loading">Searching…</li>
                            ) : (
                              operatorSearchResults.map((user) => (
                                <li key={user.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOperatorIdValue(user.id_number ?? '')
                                      setOperatorFirstName(user.firstname ?? '')
                                      setOperatorLastName(user.lastothernames ?? '')
                                      setOperatorEmail(user.email ?? '')
                                      setOperatorPhoneNumber(user.phone ?? '')
                                      setSelectedOperatorId(user.id)
                                      setShowOperatorSuggestions(false)
                                    }}
                                  >
                                    <span className="id-suggestion-id">{user.id_number ?? user.email}</span>
                                    {user.full_name && <span className="id-suggestion-name"> — {user.full_name}</span>}
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="field-label">First name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={operatorFirstName}
                        onChange={(e) => setOperatorFirstName(e.target.value)}
                        placeholder="First name"
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="field-label">Last name &amp; other names</label>
                      <input
                        type="text"
                        className="form-control"
                        value={operatorLastName}
                        onChange={(e) => setOperatorLastName(e.target.value)}
                        placeholder="Last name and other names"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="field-label">Phone number</label>
                    <PhoneInput
                      defaultCountry="UG"
                      international
                      value={operatorPhoneNumber}
                      onChange={(v) => setOperatorPhoneNumber(v ?? '')}
                      className="phone-input-control"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="field-label">Email address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={operatorEmail}
                      onChange={(e) => setOperatorEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>
                </section>

                <section className="col-12 col-md-6">
                  <h2 className="column-title">Operator residence</h2>
                  <div className="mb-3">
                    <label className="field-label">District / City</label>
                    <div className="select-shell">
                      <select className="form-select custom-select" value={district} onChange={(e) => { setDistrict(e.target.value); setCounty(''); setSubcounty(''); setParish(''); setVillage(''); }}>
                        <option value="">Select District / City</option>
                        {locationDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="field-label">County / Municipality</label>
                    <div className="select-shell">
                      <select className="form-select custom-select" value={county} onChange={(e) => { setCounty(e.target.value); setSubcounty(''); setParish(''); setVillage(''); }}>
                        <option value="">Select County / Municipality</option>
                        {residenceCounties.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="field-label">Subcounty / Town Council</label>
                    <div className="select-shell">
                      <select className="form-select custom-select" value={subcounty} onChange={(e) => { setSubcounty(e.target.value); setParish(''); setVillage(''); }}>
                        <option value="">Select Subcounty / Town Council</option>
                        {residenceSubcounties.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="field-label">Parish / Ward</label>
                    <div className="select-shell">
                      <select className="form-select custom-select" value={parish} onChange={(e) => { setParish(e.target.value); setVillage(''); }}>
                        <option value="">Select Parish / Ward</option>
                        {residenceParishes.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mb-1">
                    <label className="field-label">Village / Cell</label>
                    <div className="id-search-shell id-search-shell--village">
                      <input
                        type="text"
                        className="form-control id-search-input"
                        placeholder={parish?.trim() ? 'Search or select village...' : 'Type to search villages (or select parish first)...'}
                        value={showVillageDropdownRes ? villageFilterRes : village}
                        onChange={(e) => { setVillageFilterRes(e.target.value); setShowVillageDropdownRes(true); }}
                        onFocus={() => { setShowVillageDropdownRes(true); setVillageFilterRes(village); }}
                        onBlur={() => { const f = villageFilterRes; setTimeout(() => { setShowVillageDropdownRes(false); if (f !== undefined) setVillage(f); }, 200); }}
                      />
                      <i className="fa fa-chevron-down id-search-suffix" aria-hidden="true" />
                      {showVillageDropdownRes && (
                        <ul className="id-suggestion-list">
                          {parish?.trim() ? residenceVillages.filter((v) => (v || '').toLowerCase().includes((villageFilterRes || '').toLowerCase())).map((v) => (
                            <li key={v}><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setVillage(v); setVillageFilterRes(''); setShowVillageDropdownRes(false); }}>{v}</button></li>
                          )) : villageSearchResLoading ? <li className="id-suggestion-loading">Searching…</li> : villageSearchResResults.map((loc) => (
                            <li key={loc.id}><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => {
                              setDistrict(loc.district); setCounty(loc.county); setSubcounty(loc.subcounty); setParish(loc.parish); setVillage(loc.village);
                              setResidenceCounties((p) => (p.includes(loc.county) ? p : [loc.county, ...p])); setResidenceSubcounties((p) => (p.includes(loc.subcounty) ? p : [loc.subcounty, ...p])); setResidenceParishes((p) => (p.includes(loc.parish) ? p : [loc.parish, ...p])); setResidenceVillages((p) => (p.includes(loc.village) ? p : [loc.village, ...p])); setVillageFilterRes(''); setShowVillageDropdownRes(false);
                            }}>{loc.village}{loc.parish ? ` (${loc.parish}${loc.subcounty ? `, ${loc.subcounty}` : ''})` : ''}</button></li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              </div>
              <div className="register-footer">
                <button type="button" className="btn-outline" onClick={() => setActiveStep('operatorResidence')}><i className="fa fa-chevron-left" aria-hidden="true" /><span>Back</span></button>
                <button className="primary-button" type="submit"><span>Next</span><i className="fa fa-chevron-right" aria-hidden="true" /></button>
              </div>
            </form>
          )}

          {activeStep === 'contact' && !isIndividual && (
            <form className="register-step mt-4" onSubmit={handleSubmitContact} autoComplete="on">
              <div className="row g-4">
                <section className="col-12 col-md-6">
                  <h2 className="column-title">Contact person details</h2>

                  <div className="row g-3 mb-3 align-items-end">
                    <div className="col-12 col-sm-4">
                      <label className="field-label">ID type</label>
                      <div className="select-shell">
                        <select
                          className="form-select custom-select"
                          value={contactIdType}
                          onChange={(event) =>
                            setContactIdType(event.target.value as IdType)
                          }
                        >
                          <option value="nin">NIN</option>
                          <option value="passport">Passport No</option>
                          <option value="tin">TIN</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-12 col-sm-8">
                      <label className="field-label">
                        {contactIdType === 'passport'
                          ? 'Passport number'
                          : contactIdType === 'tin'
                            ? 'TIN'
                            : 'ID number'}
                      </label>
                      <div className="id-search-shell">
                        <span className="id-search-icon"></span>
                        <input
                          type="text"
                          className="form-control id-search-input"
                          value={contactIdValue}
                          onChange={(event) => {
                            setContactIdValue(event.target.value)
                            setSelectedContactId(null)
                            setShowContactSuggestions(true)
                          }}
                          onBlur={() =>
                            setTimeout(() => setShowContactSuggestions(false), 200)
                          }
                          placeholder="Start typing to search (min 2 chars)..."
                        />
                        {showContactSuggestions &&
                          (contactSearchLoading || contactSearchResults.length > 0) && (
                          <ul className="id-suggestion-list">
                            {contactSearchLoading ? (
                              <li className="id-suggestion-loading">Searching…</li>
                            ) : (
                              contactSearchResults.map((user) => (
                                <li key={user.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setContactIdValue(user.id_number ?? '')
                                      setContactFirstName(user.firstname ?? '')
                                      setContactLastName(user.lastothernames ?? '')
                                      setContactEmail(user.email)
                                      setContactPhoneNumber(user.phone ?? '')
                                      setSelectedContactId(user.id)
                                      setShowContactSuggestions(false)
                                    }}
                                  >
                                    <span className="id-suggestion-id">{user.id_number ?? user.email}</span>
                                    {user.full_name && (
                                      <span className="id-suggestion-name"> — {user.full_name}</span>
                                    )}
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-sm-6">
                      <label className="field-label">First name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={contactFirstName}
                        onChange={(event) =>
                          setContactFirstName(event.target.value)
                        }
                        placeholder="First name"
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="field-label">
                        Last name &amp; other names
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={contactLastName}
                        onChange={(event) =>
                          setContactLastName(event.target.value)
                        }
                        placeholder="Last name and other names"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="field-label">Phone number</label>
                    <PhoneInput
                      defaultCountry="UG"
                      international
                      value={contactPhoneNumber}
                      onChange={(value) =>
                        setContactPhoneNumber(value ?? '')
                      }
                      className="phone-input-control"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="field-label">Email address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={contactEmail}
                      onChange={(event) =>
                        setContactEmail(event.target.value)
                      }
                      placeholder="name@example.com"
                    />
                  </div>
                </section>
              </div>

              <div className="register-footer">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setActiveStep('operation')}
                >
                  <i className="fa fa-chevron-left" aria-hidden="true" />
                  <span>Back</span>
                </button>
                <button className="primary-button" type="submit">
                  <span>{isLastStep ? 'Confirm &amp; submit' : 'Next'}</span>
                  <i
                    className={`fa ${isLastStep ? 'fa-check' : 'fa-chevron-right'}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </form>
          )}

          {activeStep === 'ownerVehicle' && (
            <form className="register-step mt-4" onSubmit={handleSubmitOwnerVehicle} autoComplete="on">
              <div className="row g-4">
                <section className="col-12 col-md-6">
                  <h2 className="column-title">Owner details</h2>
                  {isIndividual && (
                    <div className="mb-3">
                      <label className="field-label">Vehicle operated by owner?</label>
                      <div className="select-shell">
                        <select
                          className="form-select custom-select"
                          value={ownerOperated}
                          onChange={(e) => {
                            const v = e.target.value as 'yes' | 'no' | ''
                            setOwnerOperated(v)
                            if (v === 'yes') {
                              setIdType(operatorIdType)
                              setIdValue(operatorIdValue)
                              setFirstName(operatorFirstName)
                              setLastName(operatorLastName)
                              setEmail(operatorEmail ?? '')
                              setPhoneNumber(operatorPhoneNumber ?? '')
                            }
                          }}
                        >
                          <option value="">Select option</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="row g-3 mb-3 align-items-end">
                    <div className="col-12 col-sm-4">
                      <label className="field-label">ID type</label>
                      <div className="select-shell">
                        <select
                          className="form-select custom-select"
                          value={idType}
                          onChange={(event) => setIdType(event.target.value as IdType)}
                        >
                          {isIndividual ? (
                            <>
                              <option value="nin">NIN</option>
                              <option value="passport">Passport No</option>
                              <option value="tin">TIN</option>
                            </>
                          ) : (
                            <>
                              <option value="brn">BRN</option>
                              <option value="tin">TIN</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="col-12 col-sm-8">
                      <label className="field-label">
                        {idType === 'passport' ? 'Passport number' : idType === 'tin' ? 'TIN' : idType === 'brn' ? 'Business registration number' : 'ID number'}
                      </label>
                      <div className="id-search-shell">
                        <i className="fa fa-search id-search-icon" aria-hidden="true" />
                        <input
                          type="text"
                          className="form-control id-search-input"
                          placeholder="Start typing to search (min 2 chars)..."
                          value={idValue}
                          onChange={(event) => {
                            setIdValue(event.target.value)
                            setSelectedOwnerId(null)
                            setShowIdSuggestions(true)
                          }}
                          onBlur={() => setTimeout(() => setShowIdSuggestions(false), 200)}
                          onFocus={() => idValue.trim().length >= 2 && setShowIdSuggestions(true)}
                        />
                        {showIdSuggestions && (ownerSearchLoading || ownerSearchResults.length > 0) && (
                          <ul className="id-suggestion-list">
                            {ownerSearchLoading ? (
                              <li className="id-suggestion-loading">Searching…</li>
                            ) : (
                              ownerSearchResults.map((user) => (
                                <li key={user.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIdValue(user.id_number ?? '')
                                      setFirstName(user.firstname ?? '')
                                      setLastName(user.lastothernames ?? '')
                                      setEmail(user.email ?? '')
                                      setPhoneNumber(user.phone ?? '')
                                      setSelectedOwnerId(user.id)
                                      setShowIdSuggestions(false)
                                    }}
                                  >
                                    <span className="id-suggestion-id">{user.id_number ?? user.email}</span>
                                    {user.full_name && <span className="id-suggestion-name"> — {user.full_name}</span>}
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                  {isIndividual ? (
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-sm-6">
                        <label className="field-label">First name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={firstName}
                          onChange={(event) => setFirstName(event.target.value)}
                          placeholder="First name"
                        />
                      </div>
                      <div className="col-12 col-sm-6">
                        <label className="field-label">Last name &amp; other names</label>
                        <input
                          type="text"
                          className="form-control"
                          value={lastName}
                          onChange={(event) => setLastName(event.target.value)}
                          placeholder="Last name and other names"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="field-label">Entity name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={entityName}
                        onChange={(event) => setEntityName(event.target.value)}
                        placeholder="Registered business or association name"
                      />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="field-label">Phone number</label>
                    <PhoneInput
                      defaultCountry="UG"
                      international
                      value={phoneNumber}
                      onChange={(value) => setPhoneNumber(value ?? '')}
                      className="phone-input-control"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="field-label">Email address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>
                </section>

                <section className="col-12 col-md-6">
                  <h2 className="column-title">Vehicle details</h2>
                  <div className="mb-3">
                    <label className="field-label">Vehicle type</label>
                    <div className="select-shell">
                      <select
                        className="form-select custom-select"
                        value={vehicleType}
                        onChange={(event) => setVehicleType(event.target.value)}
                      >
                        <option value="">Select vehicle type</option>
                        {vehicleSubcategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="field-label">Registration number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={vehicleRegistration}
                      onChange={(event) => setVehicleRegistration(event.target.value)}
                      placeholder="e.g. UAA 123A"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="field-label">Make &amp; model</label>
                    <input
                      type="text"
                      className="form-control"
                      value={vehicleMakeModel}
                      onChange={(event) => setVehicleMakeModel(event.target.value)}
                      placeholder="e.g. Toyota Hiace"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="field-label">Color</label>
                    <input
                      type="text"
                      className="form-control"
                      value={vehicleColor}
                      onChange={(event) => setVehicleColor(event.target.value)}
                      placeholder="e.g. White"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="field-label">VIN / chassis number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={vehicleVin}
                      onChange={(event) => setVehicleVin(event.target.value)}
                      placeholder="Vehicle Identification Number"
                    />
                  </div>
                </section>
              </div>
              <div className="register-footer">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setActiveStep('operatorResidence')}
                >
                  <i className="fa fa-chevron-left" aria-hidden="true" />
                  <span>Back</span>
                </button>
                <button className="primary-button" type="submit">
                  <span>{isLastStep ? 'Confirm &amp; submit' : 'Next'}</span>
                  <i
                    className={`fa ${isLastStep ? 'fa-check' : 'fa-chevron-right'}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </form>
          )}

          {activeStep === 'operation' && (
            <form className="register-step mt-4" onSubmit={handleSubmitOperation} autoComplete="on">
              <div className="row g-4">
                <section className="col-12 col-md-6">
                  <h2 className="column-title">Operation details</h2>
                  <div className="mb-3">
                    <label className="field-label">Purpose</label>
                    <div className="select-shell">
                      <select
                        className="form-select custom-select"
                        value={purpose}
                        onChange={(e) => setPurpose((e.target.value || '') as PurposeValue)}
                      >
                        <option value="">Select purpose</option>
                        {PURPOSE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="field-label">Means of operation</label>
                    <div className="select-shell">
                      <select
                        className="form-select custom-select"
                        value={modeOfOperation}
                        onChange={(e) => setModeOfOperation(e.target.value as 'stage' | 'ePlatform' | 'both' | 'neither' | '')}
                      >
                        <option value="">Select means</option>
                        <option value="stage">Stage / park</option>
                        <option value="ePlatform">E-platform</option>
                        <option value="both">Both</option>
                        <option value="neither">Neither</option>
                      </select>
                    </div>
                  </div>
                  {(modeOfOperation === 'stage' || modeOfOperation === 'both') && (
                    <div className="mb-3">
                      <label className="field-label">Stage / park</label>
                      <div className="id-search-shell">
                        <input
                          type="text"
                          className="form-control id-search-input id-search-input--no-prefix"
                          placeholder="Search stages..."
                          value={stageSearch}
                          onChange={(e) => { setStageSearch(e.target.value); setShowStageSuggestions(true); setSelectedStageId(null); }}
                          onFocus={() => stageSearch.trim() && setShowStageSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowStageSuggestions(false), 200)}
                        />
                        <i className="fa fa-chevron-down id-search-suffix" aria-hidden="true" />
                        {showStageSuggestions && stageSearch.trim().length >= 2 && (stageSearchResults.length > 0 || stageSearchLoading) && (
                          <ul className="id-suggestion-list">
                            {stageSearchLoading ? (
                              <li className="id-suggestion-loading">Searching…</li>
                            ) : (
                              stageSearchResults.map((stage) => (
                                <li key={stage.id}>
                                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectStage(stage)}>
                                    {stage.display_name}
                                    {stage.village || stage.county ? ` — ${[stage.village, stage.county].filter(Boolean).join(', ')}` : ''}
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                  {(modeOfOperation === 'ePlatform' || modeOfOperation === 'both') && (
                    <div className="mb-3">
                      <label className="field-label">E-platforms</label>
                      <Select
                        isMulti
                        options={PLATFORM_OPTIONS.map((p) => ({ value: p, label: p }))}
                        value={platforms.map((p) => ({ value: p, label: p }))}
                        onChange={(s) => setPlatforms(s ? s.map((o) => o.value) : [])}
                        placeholder="Select platforms..."
                        className="register-react-select-container"
                        classNamePrefix="register-react-select"
                        styles={{ control: (b) => ({ ...b, minHeight: 38, borderColor: '#e2e8f0' }), multiValue: (b) => ({ ...b, backgroundColor: '#f1f5f9' }), multiValueLabel: (b) => ({ ...b, color: '#020617' }) }}
                      />
                    </div>
                  )}
                </section>
                <section className="col-12 col-md-6">
                  <h2 className="column-title">Area of operation</h2>
                  <div className="row g-2">
                    <div className="col-12">
                      <label className="field-label">District</label>
                      <select className="form-select custom-select form-select-sm" value={opDistrict} onChange={(e) => { setOpDistrict(e.target.value); setOpCounty(''); setOpSubcounty(''); setOpParish(''); setOpVillage(''); }}>
                        <option value="">Select district</option>
                        {locationDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="field-label">County</label>
                      <select className="form-select custom-select form-select-sm" value={opCounty} onChange={(e) => { setOpCounty(e.target.value); setOpSubcounty(''); setOpParish(''); setOpVillage(''); }}>
                        <option value="">Select county</option>
                        {operatorCounties.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="field-label">Subcounty</label>
                      <select className="form-select custom-select form-select-sm" value={opSubcounty} onChange={(e) => { setOpSubcounty(e.target.value); setOpParish(''); setOpVillage(''); }}>
                        <option value="">Select subcounty</option>
                        {operatorSubcounties.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="field-label">Parish</label>
                      <select className="form-select custom-select form-select-sm" value={opParish} onChange={(e) => { setOpParish(e.target.value); setOpVillage(''); }}>
                        <option value="">Select parish</option>
                        {operatorParishes.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="field-label">Village</label>
                      {opParish?.trim() ? (
                        <select className="form-select custom-select form-select-sm" value={opVillage} onChange={(e) => setOpVillage(e.target.value)}>
                          <option value="">Select village</option>
                          {operatorVillages.map((v) => <option key={v} value={v}>{v}</option>)}
                        </select>
                      ) : (
                        <div className="id-search-shell id-search-shell--village">
                          <input
                            type="text"
                            className="form-control id-search-input"
                            placeholder="Search by village..."
                            value={villageFilterOp || opVillage}
                            onChange={(e) => { setVillageFilterOp(e.target.value); setOpVillage(''); }}
                            onFocus={() => villageFilterOp.trim().length >= 2 && setShowVillageDropdownOp(true)}
                            onBlur={() => setTimeout(() => setShowVillageDropdownOp(false), 200)}
                          />
                          <i className="fa fa-chevron-down id-search-suffix" aria-hidden="true" />
                          {showVillageDropdownOp && villageFilterOp.trim().length >= 2 && (villageSearchOpResults.length > 0 || villageSearchOpLoading) && (
                            <ul className="id-suggestion-list">
                              {villageSearchOpLoading ? (
                                <li className="id-suggestion-loading">Searching…</li>
                              ) : (
                                villageSearchOpResults.map((loc) => (
                                  <li key={loc.id}>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { selectOpVillageFromSearch(loc); setShowVillageDropdownOp(false); }}>
                                      {loc.village}
                                      {loc.parish || loc.subcounty ? ` — ${[loc.parish, loc.subcounty].filter(Boolean).join(', ')}` : ''}
                                    </button>
                                  </li>
                                ))
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>
              <div className="register-footer">
                <button type="button" className="btn-outline" onClick={() => setActiveStep('ownerVehicle')}>
                  <i className="fa fa-chevron-left" aria-hidden="true" />
                  <span>Back</span>
                </button>
                <button className="primary-button" type="submit">
                  <span>{isLastStep ? 'Confirm &amp; submit' : 'Next'}</span>
                  <i
                    className={`fa ${isLastStep ? 'fa-check' : 'fa-chevron-right'}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </form>
          )}

          {showSummaryDialog && (
            <div
              className="summary-dialog-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="summary-dialog-title"
            >
              <div className="summary-dialog">
                <header className="summary-dialog-header">
                  <h2 id="summary-dialog-title">Review your details</h2>
                  <button
                    type="button"
                    className="summary-dialog-close"
                    onClick={() => setShowSummaryDialog(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </header>
                <div className="summary-dialog-body">
                  <section className="summary-section">
                    <h3 className="summary-section-title">Operator details</h3>
                    <dl className="summary-list">
                      <dt>Ownership</dt>
                      <dd>{ownershipType === 'individual' ? 'Individual' : 'Non-individual'}</dd>
                      <dt>ID type</dt>
                      <dd>{idTypeToApi(operatorIdType)}</dd>
                      <dt>ID number</dt>
                      <dd>{operatorIdValue || '—'}</dd>
                      <dt>Name</dt>
                      <dd>{[operatorFirstName, operatorLastName].filter(Boolean).join(' ') || '—'}</dd>
                      <dt>Phone</dt>
                      <dd>{operatorPhoneNumber || '—'}</dd>
                      <dt>Email</dt>
                      <dd>{operatorEmail || '—'}</dd>
                      <dt>Residence</dt>
                      <dd>{[district, county, subcounty, parish, village].filter(Boolean).join(' → ') || '—'}</dd>
                    </dl>
                  </section>
                  <section className="summary-section">
                    <h3 className="summary-section-title">Owner details</h3>
                    <dl className="summary-list">
                      {isIndividual && (
                        <>
                          <dt>Owner operated</dt>
                          <dd>{ownerOperated === 'yes' ? 'Yes' : ownerOperated === 'no' ? 'No' : '—'}</dd>
                        </>
                      )}
                      <dt>ID type</dt>
                      <dd>{idTypeToApi(idType)}</dd>
                      <dt>ID number</dt>
                      <dd>{idValue || '—'}</dd>
                      <dt>Name</dt>
                      <dd>{isIndividual ? [firstName, lastName].filter(Boolean).join(' ') || '—' : entityName || '—'}</dd>
                      <dt>Phone</dt>
                      <dd>{phoneNumber || '—'}</dd>
                      <dt>Email</dt>
                      <dd>{email || '—'}</dd>
                    </dl>
                  </section>
                  <section className="summary-section">
                    <h3 className="summary-section-title">Vehicle details</h3>
                    <dl className="summary-list">
                      <dt>Type</dt>
                      <dd>{selectedVehicleSubcategory?.name || '—'}</dd>
                      <dt>Registration</dt>
                      <dd>{vehicleRegistration || '—'}</dd>
                      <dt>Make &amp; model</dt>
                      <dd>{vehicleMakeModel || '—'}</dd>
                      <dt>Color</dt>
                      <dd>{vehicleColor || '—'}</dd>
                      <dt>VIN</dt>
                      <dd>{vehicleVin || '—'}</dd>
                    </dl>
                  </section>
                  <section className="summary-section">
                    <h3 className="summary-section-title">Operation &amp; area</h3>
                    <dl className="summary-list">
                      <dt>Purpose</dt>
                      <dd>{purpose || '—'}</dd>
                      <dt>Means</dt>
                      <dd>{modeOfOperation ? (modeOfOperation === 'stage' ? 'Stage / park' : modeOfOperation === 'ePlatform' ? 'E-platform' : modeOfOperation === 'both' ? 'Both' : modeOfOperation === 'neither' ? 'Neither' : '—') : '—'}</dd>
                      <dt>Stage</dt>
                      <dd>{stageSearch || '—'}</dd>
                      <dt>E-platforms</dt>
                      <dd>{platforms.length ? platforms.join(', ') : '—'}</dd>
                      <dt>Area of operation</dt>
                      <dd>{[opDistrict, opCounty, opSubcounty, opParish, opVillage].filter(Boolean).join(' → ') || '—'}</dd>
                    </dl>
                  </section>
                  {!isIndividual && (
                    <section className="summary-section">
                      <h3 className="summary-section-title">Contact person</h3>
                      <dl className="summary-list">
                        <dt>ID type</dt>
                        <dd>{idTypeToApi(contactIdType)}</dd>
                        <dt>ID number</dt>
                        <dd>{contactIdValue || '—'}</dd>
                        <dt>Name</dt>
                        <dd>{[contactFirstName, contactLastName].filter(Boolean).join(' ') || '—'}</dd>
                        <dt>Phone</dt>
                        <dd>{contactPhoneNumber || '—'}</dd>
                        <dt>Email</dt>
                        <dd>{contactEmail || '—'}</dd>
                      </dl>
                    </section>
                  )}
                </div>
                {submitError && (
                  <div className="summary-dialog-error" role="alert">
                    {submitError}
                  </div>
                )}
                <footer className="summary-dialog-footer">
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => setShowSummaryDialog(false)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => void handleConfirmSubmit()}
                    disabled={submitLoading}
                  >
                    {submitLoading ? 'Submitting…' : (
                      <>
                        <span>Confirm &amp; submit</span>
                        <i className="fa fa-check" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </footer>
              </div>
            </div>
          )}

          {showSuccessDialog && (
            <div
              className="success-dialog-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="success-dialog-title"
            >
              <div className="success-dialog">
                <div className="success-dialog-icon" aria-hidden="true">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h2 id="success-dialog-title" className="success-dialog-title">
                  Registration submitted
                </h2>
                <p className="success-dialog-message">
                  Your application has been received. We&apos;ll review and get back to you shortly.
                </p>
                <button
                  type="button"
                  className="success-dialog-dismiss primary-button"
                  onClick={() => setShowSuccessDialog(false)}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

