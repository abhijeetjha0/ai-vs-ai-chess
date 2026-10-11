import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

export default function HelpFloatingButton({ onClick }) {
  return (
    <OverlayTrigger
      placement="left"
      delay={{ show: 150, hide: 50 }}
      overlay={<Tooltip id="tt-help-float">User Manual & Help</Tooltip>}
    >
      <button
        type="button"
        className="help-floating-btn"
        onClick={onClick}
        aria-label="Open User Manual"
      >
        <span className="material-symbols-rounded fs-5">help</span>
      </button>
    </OverlayTrigger>
  );
}
