import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Clock,
  Droplet,
  ShoppingBag,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function TestCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [sortOption, setSortOption] = useState('popular');
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');

  const { addToCart } = useCart();

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch tests based on active filters
  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append('q', search.trim());
        if (selectedCategory) params.append('category', selectedCategory);
        if (onlyPopular) params.append('popular', 'true');
        if (maxPrice) params.append('max_price', maxPrice);
        if (sortOption) params.append('sort', sortOption);

        const res = await api.get(`/tests?${params.toString()}`);
        setTests(res.data.tests || []);
      } catch (err) {
        console.error('Error fetching tests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [search, selectedCategory, sortOption, onlyPopular, maxPrice]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search) {
      setSearchParams({ q: search });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSortOption('popular');
    setOnlyPopular(false);
    setMaxPrice('');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#F0FDF4] via-emerald-50 to-white p-6 sm:p-10 border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
            Diagnostic Test Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Certified Blood & Pathology Tests
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Book individual tests or combine multiple profiles. Enjoy free doorstep sample collection across the city.
          </p>
        </div>

        {/* Global Search inside header */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96">
          <div className="relative flex items-center shadow-sm rounded-2xl overflow-hidden border border-emerald-200 bg-white">
            <Search className="w-4 h-4 text-slate-400 ml-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tests (e.g. CBC, Lipid, HbA1c)..."
              className="w-full py-3 pl-2 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1.5 mr-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Categories Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            !selectedCategory
              ? 'bg-[#16A34A] text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug || cat.name)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === cat.slug || selectedCategory === cat.name
                ? 'bg-[#16A34A] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cat.name} ({cat.test_count || 0})
          </button>
        ))}
      </div>

      {/* Main Content Layout (Sidebar Filters + Test Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filters Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-sm font-bold text-slate-800">
                <SlidersHorizontal className="w-4 h-4 text-[#16A34A]" />
                <span>Filter Tests</span>
              </div>
              <button
                onClick={clearFilters}
                className="text-xs text-[#16A34A] font-semibold hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Sort By</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              >
                <option value="popular">Recommended / Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Test Name: A to Z</option>
                <option value="name_desc">Test Name: Z to A</option>
              </select>
            </div>

            {/* Max Price Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Maximum Price</span>
                <span>{maxPrice ? `₹${maxPrice}` : 'Any'}</span>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="50"
                value={maxPrice || 2500}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full accent-[#16A34A]"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>₹100</span>
                <span>₹2500+</span>
              </div>
            </div>

            {/* Popular toggle */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center space-x-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyPopular}
                  onChange={(e) => setOnlyPopular(e.target.checked)}
                  className="rounded text-[#16A34A] focus:ring-[#16A34A] w-4 h-4 accent-[#16A34A]"
                />
                <span>Show Popular Tests Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Tests Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
            <span>Showing <strong className="text-slate-800">{tests.length}</strong> diagnostic tests</span>
          </div>

          {loading ? (
            <LoadingSpinner message="Filtering diagnostic tests..." />
          ) : tests.length === 0 ? (
            <EmptyState
              title="No tests match your criteria"
              description="Try adjusting your search keyword or clearing the applied category and price filters."
              actionLabel="Clear Filters"
              onAction={clearFilters}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D]">
                        {test.category_name || 'Biochemistry'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono font-medium">{test.test_code}</span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">{test.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{test.description}</p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Droplet className="w-3.5 h-3.5 text-rose-500 mr-1.5" />
                          Sample:
                        </span>
                        <span className="font-semibold text-slate-700 truncate max-w-[140px]">{test.sample_type || 'Blood'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                          Report TAT:
                        </span>
                        <span className="font-semibold text-slate-700">{test.report_time || 'Same Day'}</span>
                      </div>
                      {test.fasting_required && (
                        <div className="flex items-center justify-between text-amber-600 font-semibold">
                          <span className="flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                            Fasting:
                          </span>
                          <span>Required</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-black text-slate-900">
                        ₹{test.discount_price || test.price}
                      </div>
                      {test.discount_price && test.discount_price < test.price && (
                        <span className="text-[11px] text-slate-400 line-through">₹{test.price}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Link
                        to={`/tests/${test.id}`}
                        className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => addToCart(test, 'test')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm transition"
                      >
                        Book Test
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
