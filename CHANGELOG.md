# Changelog

All notable changes to the Avante AI Compliance project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-15

### Added

#### Program & Policy Management
- Full CRUD operations for compliance programs and policies
- Version history tracking for all program and policy changes
- Ability to view, compare, and restore previous versions
- Hierarchical organization of policies under programs

#### Evidence Upload & Parsing
- File upload support for evidence documents (PDF, DOCX, XLSX, CSV, images)
- Automated document parsing and metadata extraction
- Evidence linking to specific policies and controls
- Bulk upload capability with progress tracking

#### Simulated AI Validation
- AI-powered compliance validation engine for uploaded evidence
- Automated gap analysis between policies and evidence
- Confidence scoring for compliance status assessments
- Detailed validation reports with actionable recommendations

#### Exception Workflow
- Exception request creation and submission process
- Multi-level approval workflow with configurable approval chains
- Exception expiration tracking with automated notifications
- Risk assessment integration for exception requests
- Full audit trail for exception lifecycle events

#### Role-Based Dashboards
- Administrator dashboard with system-wide compliance overview
- Compliance Officer dashboard with policy and evidence management views
- Auditor dashboard with read-only access to compliance data and reports
- Business User dashboard with task-oriented compliance activities
- Customizable dashboard widgets and layout preferences

#### Notifications
- In-app notification center with real-time updates
- Email notification support for critical compliance events
- Configurable notification preferences per user
- Notifications for policy updates, evidence review requests, exception approvals, and upcoming deadlines

#### Export Center
- Export compliance reports in PDF, CSV, and Excel formats
- Scheduled report generation and delivery
- Customizable report templates
- Bulk export of evidence and audit records

#### Audit Logging
- Comprehensive audit trail for all system actions
- Immutable audit log entries with timestamps and user attribution
- Searchable and filterable audit log interface
- Audit log export for external review and archival

#### Platform Foundation
- ASP.NET Core 9 Web API backend with RESTful endpoints
- React 18 frontend with Vite build tooling
- Role-based access control (RBAC) with JWT authentication
- Responsive UI with Tailwind CSS styling
- API documentation with Swagger/OpenAPI