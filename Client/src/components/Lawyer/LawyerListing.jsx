import { useEffect, useState, useMemo, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MapPin,
  Phone,
  Briefcase,
  Scale,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Globe,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { getApprovedLawyers } from '../../store/slices/lawyerSlice';
import { getLawyerById } from '../../store/slices/consultationSlice';
import { lawyerAPI } from '../../services/api';
import GlassCard from '../common/GlassCard';
import LawyerDetail from './LawyerDetail';
import { INDIAN_STATES } from '../../constants/indianStates';
import { LAWYER_SPECIALIZATIONS } from '../../constants/lawyerSpecializations';

const ITEMS_PER_PAGE = 18;

const POPULAR_SEARCH_TAGS = [
  'Delhi',
  'Maharashtra',
  'Madhya Pradesh',
  'Family Law',
  'Criminal Law',
  'Domestic Violence',
  'Women Rights',
  'Pune',
];

const LawyerListing = () => {
  const dispatch = useDispatch();
  const { openLawyerId, setOpenLawyerId } = useContext(AppContext);
  const { approvedLawyers, loading } = useSelector((state) => state.lawyer);
  const [selectedLawyerId, setSelectedLawyerId] = useState(null);

  const [filters, setFilters] = useState({
    state: '',
    district: '',
    specialization: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch lawyers from backend when state, district, or specialization changes
  useEffect(() => {
    dispatch(
      getApprovedLawyers({
        state: filters.state,
        district: filters.district,
        specialization: filters.specialization,
      })
    );
    setCurrentPage(1);
  }, [dispatch, filters.state, filters.district, filters.specialization]);

  // Fetch available districts based on selected state
  useEffect(() => {
    let isMounted = true;
    setLoadingDistricts(true);
    lawyerAPI
      .getDistricts(filters.state)
      .then((res) => {
        if (isMounted && res.data?.districts) {
          setAvailableDistricts(res.data.districts);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch districts:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingDistricts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters.state]);

  // Handle open lawyer from global context
  useEffect(() => {
    if (openLawyerId) {
      setSelectedLawyerId(openLawyerId);
      dispatch(getLawyerById(openLawyerId));
      setOpenLawyerId(null);
    }
  }, [openLawyerId, setOpenLawyerId, dispatch]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleStateChange = (stateValue) => {
    setFilters((prev) => ({
      ...prev,
      state: stateValue,
      district: '', // Reset district when state changes
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      state: '',
      district: '',
      specialization: '',
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleViewDetails = (lawyerId) => {
    setSelectedLawyerId(lawyerId);
    dispatch(getLawyerById(lawyerId));
  };

  // High-performance tokenized multi-field search (matches across all fields)
  const displayedLawyers = useMemo(() => {
    if (!searchTerm.trim()) return approvedLawyers;

    // Split search input into tokens (e.g. "madhya pradesh" -> ["madhya", "pradesh"])
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);

    return approvedLawyers.filter((lawyer) => {
      const specStr = Array.isArray(lawyer.specialization)
        ? lawyer.specialization.join(' ')
        : lawyer.specialization || '';

      // Aggregate all searchable text for this advocate
      const searchableText = [
        lawyer.name,
        lawyer.state,
        lawyer.district,
        lawyer.city,
        lawyer.address,
        lawyer.barNumber,
        lawyer.phone,
        specStr,
        lawyer.bio,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Every word in search query must be present
      return tokens.every((token) => searchableText.includes(token));
    });
  }, [approvedLawyers, searchTerm]);

  if (selectedLawyerId) {
    return <LawyerDetail lawyerId={selectedLawyerId} />;
  }

  const hasActiveFilters = Boolean(
    filters.state || filters.district || filters.specialization || searchTerm.trim()
  );

  // Pagination calculation
  const totalPages = Math.ceil(displayedLawyers.length / ITEMS_PER_PAGE) || 1;
  const paginatedLawyers = displayedLawyers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="page-container" style={{ maxWidth: '1240px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '99px',
            background: 'rgba(168, 85, 247, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: '#c084fc',
            fontSize: '0.85rem',
            fontWeight: 500,
            marginBottom: '1rem',
          }}
        >
          <Scale size={16} />
          <span>National Legal Directory & Advocate Network</span>
        </div>

        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            marginBottom: '0.75rem',
            background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Find Verified Advocates & Legal Experts
        </h1>
        <p
          style={{
            color: 'var(--text-muted, #94a3b8)',
            fontSize: '1.05rem',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Search advocate contacts categorized by State and District. Connect for immediate legal help, court representation, and rights counseling.
        </p>
      </div>

      {/* Redesigned Search & Filter Card */}
      <GlassCard style={{ marginBottom: '2rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Prominent Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search
              size={22}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#c084fc',
              }}
            />
            <input
              type="text"
              placeholder="Type any advocate name, state (e.g. Madhya Pradesh), district, city, or specialization..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '16px 44px 16px 48px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1.5px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '1.05rem',
                outline: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                }}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Search Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} style={{ color: '#c084fc' }} /> Quick Search:
            </span>
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchTerm(tag);
                  setCurrentPage(1);
                }}
                style={{
                  background: searchTerm.toLowerCase() === tag.toLowerCase() ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${searchTerm.toLowerCase() === tag.toLowerCase() ? '#a855f7' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: searchTerm.toLowerCase() === tag.toLowerCase() ? '#f3e8ff' : '#cbd5e1',
                  borderRadius: '99px',
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Dropdown Filters: State, District, Specialization */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              alignItems: 'flex-end',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '1.25rem',
            }}
          >
            {/* State Selector */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                State / UT
              </label>
              <select
                value={filters.state}
                onChange={(e) => handleStateChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                <option value="">All States ({INDIAN_STATES.length})</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>

            {/* District Selector */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                District {loadingDistricts && '(Loading...)'}
              </label>
              <select
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                disabled={loadingDistricts}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: loadingDistricts ? 'wait' : 'pointer',
                  fontSize: '0.95rem',
                  opacity: loadingDistricts ? 0.7 : 1,
                }}
              >
                <option value="">
                  {filters.state ? `All Districts in ${filters.state}` : 'All Districts'}
                </option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Specialization Selector */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Specialization
              </label>
              <select
                value={filters.specialization}
                onChange={(e) => handleFilterChange('specialization', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                <option value="">All Specializations</option>
                {LAWYER_SPECIALIZATIONS.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <div style={{ display: 'flex' }}>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '10px',
                    color: '#f87171',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <RotateCcw size={15} />
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Results Header / Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '0 0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9' }}>
            {loading ? 'Searching advocates...' : `${displayedLawyers.length} Advocates Found`}
          </span>
          {filters.state && (
            <span
              style={{
                fontSize: '0.8rem',
                padding: '3px 10px',
                borderRadius: '99px',
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#c084fc',
              }}
            >
              State: {filters.state}
            </span>
          )}
          {filters.district && (
            <span
              style={{
                fontSize: '0.8rem',
                padding: '3px 10px',
                borderRadius: '99px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#93c5fd',
              }}
            >
              District: {filters.district}
            </span>
          )}
          {searchTerm.trim() && (
            <span
              style={{
                fontSize: '0.8rem',
                padding: '3px 10px',
                borderRadius: '99px',
                background: 'rgba(234, 179, 8, 0.2)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                color: '#fde047',
              }}
            >
              Matching: "{searchTerm.trim()}"
            </span>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Main Lawyer Cards List */}
      {loading && approvedLawyers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(168, 85, 247, 0.2)',
              borderTopColor: '#a855f7',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Loading advocates from directory...</p>
        </div>
      ) : displayedLawyers.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Scale size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#f1f5f9' }}>No advocates found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            {hasActiveFilters
              ? 'No lawyers match your selected state, district, or search query. Try clearing some filters to see more results.'
              : 'No approved lawyers are currently listed in the system.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              style={{
                padding: '10px 20px',
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid #a855f7',
                borderRadius: '8px',
                color: '#c084fc',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Reset All Filters
            </button>
          )}
        </GlassCard>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {paginatedLawyers.map((lawyer) => (
              <GlassCard
                key={lawyer._id || lawyer.id}
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(15, 23, 42, 0.55)',
                  backdropFilter: 'blur(16px)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '99px',
                        background: lawyer.isSeed
                          ? 'rgba(59, 130, 246, 0.15)'
                          : 'rgba(168, 85, 247, 0.15)',
                        border: `1px solid ${
                          lawyer.isSeed ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)'
                        }`,
                        color: lawyer.isSeed ? '#60a5fa' : '#c084fc',
                      }}
                    >
                      {lawyer.isSeed ? <Globe size={12} /> : <ShieldCheck size={12} />}
                      {lawyer.isSeed ? 'Public Directory' : 'Shakti Verified'}
                    </span>

                    {lawyer.experience > 0 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted, #94a3b8)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Briefcase size={12} />
                        {lawyer.experience} yrs exp
                      </span>
                    )}
                  </div>

                  {/* Name & Bar Number */}
                  <h3
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                      color: '#f8fafc',
                      lineHeight: 1.3,
                    }}
                  >
                    {lawyer.name}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted, #94a3b8)',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Scale size={13} style={{ color: '#a855f7' }} />
                    Bar No: {lawyer.barNumber}
                  </p>

                  {/* Location (State & District Wise Highlight) */}
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      fontSize: '0.85rem',
                      color: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                    }}
                  >
                    <MapPin size={15} style={{ color: '#ec4899', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: 1.4 }}>
                      {lawyer.city && <strong style={{ color: '#f1f5f9' }}>{lawyer.city}, </strong>}
                      {lawyer.district && lawyer.district !== lawyer.city && (
                        <span>{lawyer.district} (Dist.), </span>
                      )}
                      <span style={{ color: '#a855f7', fontWeight: 600 }}>{lawyer.state}</span>
                    </span>
                  </div>

                  {/* Specializations */}
                  {lawyer.specialization && lawyer.specialization.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {lawyer.specialization.slice(0, 3).map((spec, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              background: 'rgba(168, 85, 247, 0.12)',
                              border: '1px solid rgba(168, 85, 247, 0.25)',
                              borderRadius: '6px',
                              color: '#c084fc',
                            }}
                          >
                            {spec}
                          </span>
                        ))}
                        {lawyer.specialization.length > 3 && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 6px',
                              color: 'var(--text-muted)',
                            }}
                          >
                            +{lawyer.specialization.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Call & View Profile */}
                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '1rem',
                    marginTop: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                  }}
                >
                  <a
                    href={`tel:${lawyer.phone}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '9px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '8px',
                      color: '#4ade80',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Phone size={15} />
                    Call: {lawyer.phone}
                  </a>

                  <button
                    onClick={() => handleViewDetails(lawyer._id || lawyer.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '9px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      borderRadius: '8px',
                      color: '#c084fc',
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Eye size={15} />
                    View Details & Bio
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '3rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 14px',
                  background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.9rem',
                }}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((pageNum, idx, array) => {
                  const showEllipsis = idx > 0 && pageNum - array[idx - 1] > 1;
                  return (
                    <span key={pageNum} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {showEllipsis && (
                        <span style={{ padding: '0 6px', color: 'var(--text-muted)' }}>...</span>
                      )}
                      <button
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          border:
                            currentPage === pageNum
                              ? '1px solid #a855f7'
                              : '1px solid rgba(255,255,255,0.1)',
                          background:
                            currentPage === pageNum
                              ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                              : 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          fontWeight: currentPage === pageNum ? 700 : 400,
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        {pageNum}
                      </button>
                    </span>
                  );
                })}

              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 14px',
                  background:
                    currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.9rem',
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LawyerListing;
