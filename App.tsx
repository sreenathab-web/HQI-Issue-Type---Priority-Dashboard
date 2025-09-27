import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from './components/ui/sonner';
import { SearchBar } from './components/SearchBar';
import { FilterChips } from './components/FilterChips';
import { LeftNavigation } from './components/LeftNavigation';
import { SectionHeader } from './components/SectionHeader';
import { IssueCard } from './components/IssueCard';
import { EmptyState } from './components/EmptyState';
import { issuesData, getUniqueIssueTypes, getUniquePriorities, IssueRecord } from './data/issuesData';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [issueTypeFilter, setIssueTypeFilter] = useState('All');
  const [activeSection, setActiveSection] = useState('');

  const uniqueIssueTypes = getUniqueIssueTypes();
  const uniquePriorities = getUniquePriorities();
  const issueTypeOptions = ['All', ...uniqueIssueTypes];

  // Filter issues based on search and filters
  const filteredIssues = useMemo(() => {
    return issuesData.filter((issue) => {
      // Search logic - check if query is contained in any field
      const searchFields = [
        issue.issueType,
        issue.subIssueType,
        issue.priority,
        issue.firstSuggestedAction,
        issue.checklist,
        issue.alternateActionRule,
        issue.primaryOwner
      ].join(' ').toLowerCase();
      
      const matchesSearch = searchQuery === '' || 
        searchFields.includes(searchQuery.toLowerCase());

      // Priority filter
      const matchesPriority = priorityFilter === 'All' || 
        issue.priority === priorityFilter;

      // Issue type filter
      const matchesIssueType = issueTypeFilter === 'All' || 
        issue.issueType === issueTypeFilter;

      return matchesSearch && matchesPriority && matchesIssueType;
    });
  }, [searchQuery, priorityFilter, issueTypeFilter]);

  // Group filtered issues by issue type
  const groupedIssues = useMemo(() => {
    const groups: Record<string, IssueRecord[]> = {};
    filteredIssues.forEach((issue) => {
      if (!groups[issue.issueType]) {
        groups[issue.issueType] = [];
      }
      groups[issue.issueType].push(issue);
    });
    return groups;
  }, [filteredIssues]);

  // Get issue counts for navigation
  const issueCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    uniqueIssueTypes.forEach(type => {
      counts[type] = (groupedIssues[type] || []).length;
    });
    return counts;
  }, [groupedIssues, uniqueIssueTypes]);

  // Handle preset search queries
  const handlePresetSearch = (query: string) => {
    setSearchQuery(query);
    setIssueTypeFilter('All');
    setPriorityFilter('All');
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearchQuery('');
    setPriorityFilter('All');
    setIssueTypeFilter('All');
    setActiveSection('');
  };

  // Detect active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = uniqueIssueTypes.map(type => ({
        type,
        element: document.getElementById(`section-${type.replace(/\s+/g, '-').toLowerCase()}`)
      })).filter(s => s.element);

      let current = '';
      for (const section of sections) {
        const rect = section.element!.getBoundingClientRect();
        if (rect.top <= 200) {
          current = section.type;
        }
      }
      
      if (current !== activeSection) {
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection, uniqueIssueTypes]);

  const hasActiveFilters = priorityFilter !== 'All' || issueTypeFilter !== 'All';
  const hasResults = filteredIssues.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            HQI First Action Dashboard
          </h1>
          <p className="text-muted-foreground mb-8">
            Search any issue to see first action, checklist, and alternates
          </p>
          
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search any issue to see first action, checklist, and alternates..."
          />
        </motion.header>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <FilterChips
            selectedPriority={priorityFilter}
            selectedIssueType={issueTypeFilter}
            priorityOptions={uniquePriorities}
            issueTypeOptions={issueTypeOptions}
            onPriorityChange={setPriorityFilter}
            onIssueTypeChange={setIssueTypeFilter}
            onClearAll={handleClearAll}
            totalCount={issuesData.length}
            filteredCount={filteredIssues.length}
          />
        </motion.div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Left Navigation */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-72 flex-shrink-0 hidden lg:block"
          >
            <LeftNavigation
              issueTypes={uniqueIssueTypes}
              issueCounts={issueCounts}
              activeSection={activeSection}
              onSectionClick={setActiveSection}
            />
          </motion.aside>

          {/* Main Content Area */}
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1 min-w-0"
          >
            <AnimatePresence mode="wait">
              {!hasResults ? (
                <EmptyState
                  searchQuery={searchQuery}
                  hasFilters={hasActiveFilters}
                  onReset={handleClearAll}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  {Object.entries(groupedIssues)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([issueType, issues]) => (
                      <motion.section
                        key={issueType}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <SectionHeader
                          issueType={issueType}
                          count={issues.length}
                          id={`section-${issueType.replace(/\s+/g, '-').toLowerCase()}`}
                        />
                        
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <AnimatePresence>
                            {issues.map((issue, index) => (
                              <IssueCard
                                key={`${issue.issueType}-${issue.subIssueType}-${index}`}
                                issue={issue}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.section>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        </div>
      </div>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 1500,
          style: {
            background: 'var(--color-card)',
            color: 'var(--color-card-foreground)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
    </div>
  );
}