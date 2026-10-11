import React, { useState, useMemo } from 'react';
import { Modal, Form, Badge, Button } from 'react-bootstrap';
import helpSections from '../data/help-sections.json';

export default function HelpModal({ show, onHide }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(helpSections.map((s) => s.category));
    return ['All', ...Array.from(set)];
  }, []);

  // Filter sections based on search query and category
  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return helpSections.filter((sec) => {
      const matchesCategory = selectedCategory === 'All' || sec.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      const titleMatch = sec.title.toLowerCase().includes(q);
      const descMatch = sec.description.toLowerCase().includes(q);
      const catMatch = sec.category.toLowerCase().includes(q);
      const stepsMatch = sec.steps.some((step) => step.toLowerCase().includes(q));

      return titleMatch || descMatch || catMatch || stepsMatch;
    });
  }, [searchQuery, selectedCategory]);

  const handleJumpToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      scrollable
      data-bs-theme="dark"
      className="help-modal"
    >
      <Modal.Body className="glass-panel p-0 bg-dark text-light border border-secondary border-opacity-25 rounded-3 d-flex flex-column" style={{ maxHeight: '85vh' }}>
        {/* TOP SEARCH & FILTER BAR */}
        <div className="p-3 border-bottom border-secondary border-opacity-25 bg-black bg-opacity-40">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
              <span className="material-symbols-rounded text-cyan fs-4">menu_book</span>
              <span className="fw-bold fs-5 text-light">AI vs AI Chess User Manual</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary border-0 p-1 rounded-circle"
              onClick={onHide}
              aria-label="Close Manual"
            >
              <span className="material-symbols-rounded fs-5">close</span>
            </button>
          </div>

          <div className="search-bar-wrapper position-relative mb-2">
            <span
              className="material-symbols-rounded position-absolute text-muted"
              style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}
            >
              search
            </span>
            <Form.Control
              type="text"
              placeholder="Search features, controls, rules, or steps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onInput={(e) => setSearchQuery(e.target.value)}
              className="bg-dark bg-opacity-75 text-light border-secondary border-opacity-50 ps-5 py-2 rounded-3 shadow-none"
              style={{ fontSize: '0.85rem' }}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn btn-sm text-secondary position-absolute border-0 p-0"
                style={{ right: '12px', top: '50%', transform: 'translateY(-50%)' }}
                onClick={() => setSearchQuery('')}
              >
                <span className="material-symbols-rounded fs-6">cancel</span>
              </button>
            )}
          </div>

          {/* CATEGORY CHIPS */}
          <div className="d-flex flex-wrap pt-1" style={{ gap: '6px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm px-2.5 py-1 rounded-pill small fw-semibold border-0 ${
                  selectedCategory === cat
                    ? 'btn-primary text-white shadow'
                    : 'bg-secondary bg-opacity-25 text-light text-opacity-75'
                }`}
                style={{ fontSize: '0.75rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT SECTIONS STREAM */}
        <div className="help-sections-content p-3 p-md-4 overflow-y-auto flex-grow-1" style={{ scrollBehavior: 'smooth' }}>
          {filteredSections.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <span className="material-symbols-rounded fs-1 d-block mb-2 text-secondary opacity-50">search_off</span>
              <p className="mb-1 fw-semibold text-light">No manual sections match your search.</p>
              <span className="small text-muted">Try searching with a different term or selecting 'All' categories.</span>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {filteredSections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="help-section-card p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25"
                >
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <h2 className="h5 fw-bold text-light mb-0 d-flex align-items-center gap-2">
                      <span className="material-symbols-rounded text-info fs-5">help_outline</span>
                      {section.title}
                    </h2>
                    <Badge bg="dark" className="border border-secondary border-opacity-50 text-secondary fw-semibold small">
                      {section.category}
                    </Badge>
                  </div>

                  <p className="text-light text-opacity-85 small mb-3" style={{ lineHeight: '1.5' }}>
                    {section.description}
                  </p>

                  <div className="steps-container p-2.5 rounded bg-black bg-opacity-40 border border-secondary border-opacity-20">
                    <h3 className="h6 fw-bold text-info mb-2 small text-uppercase letter-spacing-1 d-flex align-items-center gap-1">
                      <span className="material-symbols-rounded fs-6">checklist</span>
                      {section.stepsTitle}
                    </h3>
                    <ol className="list-unstyled mb-0 d-flex flex-column gap-1.5">
                      {section.steps.map((step, idx) => (
                        <li key={idx} className="small text-light text-opacity-90 d-flex align-items-baseline gap-2">
                          <span className="text-muted fw-mono" style={{ fontSize: '0.8rem' }}>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-2.5 px-3 border-top border-secondary border-opacity-25 bg-black bg-opacity-40 d-flex justify-content-between align-items-center">
          <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
            Showing {filteredSections.length} of {helpSections.length} topics
          </span>
          <Button variant="outline-secondary" size="sm" onClick={onHide}>
            Close
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
