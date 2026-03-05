/**
 * Admin Audit Log Viewer
 *
 * Admin-only audit log viewer with filtering.
 * View before/after values and export audit logs.
 *
 * @module components/admin/AuditLogViewer
 */

import React, { useState } from 'react';
import { useAuditLogsPaginated, useAuditLogSummary } from '@/hooks/firebase/useFirebaseAudit';
import { exportAuditLogsToCSV, exportAuditLogsToJSON } from '@/services/firebase/auditLogs.service';
import { Card, CardContent } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================
// Types
// ============================================

interface AuditLogViewerProps {
  /**
   * Firm ID
   */
  firmId: string;

  /**
   * User ID
   */
  userId: string;

  /**
   * User role (for permission check)
   */
  userRole?: string;
}

// ============================================
// Component
// ============================================

export function AuditLogViewer({ firmId, userId, userRole }: AuditLogViewerProps): React.JSX.Element | null {
  // State
  const [filters, setFilters] = useState({
    operation: undefined,
    collection: undefined,
    startDate: undefined,
    endDate: undefined,
    success: undefined,
    complianceStatus: undefined,
    riskLevel: undefined,
    reviewed: undefined,
    remoteIp: undefined,
    requestId: undefined,
    sessionId: undefined,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAuditLog, setSelectedAuditLog] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Queries
  const { data: auditLogsData, totalCount, page: currentPage, hasMore, loading: auditLogsLoading } =
    useAuditLogsPaginated({
      firmId,
      page,
      pageSize,
      sort: {
        field: sortBy,
        direction: sortOrder,
      },
    });

  const { data: summary, loading: summaryLoading } = useAuditLogSummary({ firmId });

  // Permission check (admin only)
  if (userRole !== 'admin') {
    return (
      <div className="audit-log-viewer unauthorized">
        <h1>Unauthorized</h1>
        <p>You do not have permission to view audit logs.</p>
      </div>
    );
  }

  if (auditLogsLoading || summaryLoading) {
    return (
      <div className="audit-log-viewer loading">
        <LoadingSpinner />
        <p>Loading audit logs...</p>
      </div>
    );
  }

  const auditLogs = auditLogsData?.data || [];

  // Handlers
  const handleFilterChange = (filterKey: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));

    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }

    setPage(1);
  };

  const handleAuditLogClick = (auditLogId: string) => {
    setSelectedAuditLog(auditLogId);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedAuditLog(null);
  };

  const handleRefresh = () => {
    setPage(1);
    setFilters({
      operation: undefined,
      collection: undefined,
      startDate: undefined,
      endDate: undefined,
      success: undefined,
      complianceStatus: undefined,
      riskLevel: undefined,
      reviewed: undefined,
      remoteIp: undefined,
      requestId: undefined,
      sessionId: undefined,
    });
  };

  const handleExportCSV = async () => {
    const allAuditLogs = auditLogsData?.data || [];

    // Fetch all audit logs (simplified - in production, fetch all pages)
    alert('This will export all audit logs in the current view.');

    try {
      const csv = exportAuditLogsToCSV(allAuditLogs);

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export audit logs to CSV');
      console.error('Export error:', error);
    }
  };

  const handleExportJSON = async () => {
    const allAuditLogs = auditLogsData?.data || [];

    alert('This will export all audit logs in the current view.');

    try {
      const json = exportAuditLogsToJSON(allAuditLogs);

      // Create download link
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export audit logs to JSON');
      console.error('Export error:', error);
    }
  };

  // Render
  return (
    <div className="audit-log-viewer">
      {/* Header */}
      <div className="audit-log-viewer-header">
        <h1>Audit Log Viewer</h1>
        <div className="audit-log-viewer-actions">
          <Button onClick={handleRefresh} variant="secondary">Refresh</Button>
          <Button onClick={handleExportCSV} variant="secondary">Export CSV</Button>
          <Button onClick={handleExportJSON} variant="secondary">Export JSON</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="audit-log-viewer-summary">
        <h2>Summary</h2>
        <div className="summary-cards">
          <Card>
            <CardContent>
              <h3>Total Logs</h3>
              <p>{summary?.totalLogs || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Creates</h3>
              <p>{summary?.totalCreates || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Updates</h3>
              <p>{summary?.totalUpdates || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Deletes</h3>
              <p>{summary?.totalDeletes || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Success Rate</h3>
              <p>{((summary?.successRate || 0) * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Compliance Rate</h3>
              <p>{((summary?.complianceRate || 0) * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>High Risk Logs</h3>
              <p>{summary?.highRiskLogs || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Reviewed</h3>
              <p>{summary?.reviewedLogs || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h3>Unreviewed</h3>
              <p>{summary?.unreviewedLogs || 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="audit-log-viewer-filters">
        <h2>Filters</h2>
        <div className="filter-grid">
          <div className="filter-group">
            <label>Operation</label>
            <Select
              value={filters.operation}
              onChange={(value) => handleFilterChange('operation', value)}
              options={[
                { label: 'All Operations', value: undefined },
                { label: 'Create', value: 'create' },
                { label: 'Update', value: 'update' },
                { label: 'Delete', value: 'delete' },
                { label: 'Read', value: 'read' },
                { label: 'Batch', value: 'batch' },
                { label: 'Match', value: 'match' },
                { label: 'Reconcile', value: 'reconcile' },
              ]}
            />
          </div>

          <div className="filter-group">
            <label>Collection</label>
            <Select
              value={filters.collection}
              onChange={(value) => handleFilterChange('collection', value)}
              options={[
                { label: 'All Collections', value: undefined },
                { label: 'Users', value: 'users' },
                { label: 'Firms', value: 'firms' },
                { label: 'Matters', value: 'matters' },
                { label: 'Transactions', value: 'transactions' },
                { label: 'Rate Entries', value: 'rate_entries' },
                { label: 'Daily Balances', value: 'daily_balances' },
                { label: 'Allocations', value: 'allocations' },
                { label: 'Allocation Details', value: 'allocation_details' },
                { label: 'Bank Feeds', value: 'bank_feeds' },
              ]}
            />
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Success</label>
            <Select
              value={filters.success}
              onChange={(value) => handleFilterChange('success', value)}
              options={[
                { label: 'All', value: undefined },
                { label: 'Success', value: true },
                { label: 'Failed', value: false },
              ]}
            />
          </div>

          <div className="filter-group">
            <label>Compliance Status</label>
            <Select
              value={filters.complianceStatus}
              onChange={(value) => handleFilterChange('complianceStatus', value)}
              options={[
                { label: 'All', value: undefined },
                { label: 'Compliant', value: 'compliant' },
                { label: 'Non-Compliant', value: 'non-compliant' },
                { label: 'Flagged', value: 'flagged' },
                { label: 'Investigated', value: 'investigated' },
              ]}
            />
          </div>

          <div className="filter-group">
            <label>Risk Level</label>
            <Select
              value={filters.riskLevel}
              onChange={(value) => handleFilterChange('riskLevel', value)}
              options={[
                { label: 'All', value: undefined },
                { label: 'High (70%+)', value: 0.7 },
                { label: 'Medium (50%+)', value: 0.5 },
                { label: 'Low (30%+)', value: 0.3 },
              ]}
            />
          </div>

          <div className="filter-group">
            <label>Reviewed</label>
            <Select
              value={filters.reviewed}
              onChange={(value) => handleFilterChange('reviewed', value)}
              options={[
                { label: 'All', value: undefined },
                { label: 'Reviewed', value: true },
                { label: 'Unreviewed', value: false },
              ]}
            />
          </div>

          <div className="filter-group">
            <label>Remote IP</label>
            <Input
              type="text"
              placeholder="IP address"
              value={filters.remoteIp}
              onChange={(e) => handleFilterChange('remoteIp', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Request ID</label>
            <Input
              type="text"
              placeholder="Request ID"
              value={filters.requestId}
              onChange={(e) => handleFilterChange('requestId', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Session ID</label>
            <Input
              type="text"
              placeholder="Session ID"
              value={filters.sessionId}
              onChange={(e) => handleFilterChange('sessionId', e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <Button onClick={handleRefresh} variant="secondary">Reset Filters</Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="audit-log-viewer-results">
        <h2>Results ({totalCount} logs)</h2>
        <Table
          data={auditLogs}
          columns={[
            {
              key: 'auditLogId',
              title: 'ID',
              render: (row) => (
                <span className="audit-log-id">{row.id}</span>
              ),
              sortable: false,
            },
            {
              key: 'timestamp',
              title: 'Timestamp',
              render: (row) => (
                <span>{new Date(row.data.timestamp).toLocaleString()}</span>
              ),
              sortable: true,
            },
            {
              key: 'operation',
              title: 'Operation',
              render: (row) => (
                <Badge variant={row.data.operation === 'create' ? 'success' : row.data.operation === 'delete' ? 'danger' : 'default'}>
                  {row.data.operation.toUpperCase()}
                </Badge>
              ),
              sortable: true,
            },
            {
              key: 'collection',
              title: 'Collection',
              render: (row) => (
                <span>{row.data.collection}</span>
              ),
              sortable: true,
            },
            {
              key: 'documentId',
              title: 'Document ID',
              render: (row) => (
                <span className="document-id">{row.data.documentId}</span>
              ),
              sortable: true,
            },
            {
              key: 'userId',
              title: 'User',
              render: (row) => (
                <span>{row.data.userEmail}</span>
              ),
              sortable: true,
            },
            {
              key: 'firmId',
              title: 'Firm ID',
              render: (row) => (
                <span>{row.data.firmId}</span>
              ),
              sortable: true,
            },
            {
              key: 'duration',
              title: 'Duration',
              render: (row) => (
                <span>{row.data.duration ? `${row.data.duration}ms` : '-'}</span>
              ),
              sortable: true,
            },
            {
              key: 'success',
              title: 'Success',
              render: (row) => (
                <span className={row.data.success ? 'success' : 'failure'}>
                  {row.data.success ? '✅' : '❌'}
                </span>
              ),
              sortable: true,
            },
            {
              key: 'complianceStatus',
              title: 'Compliance',
              render: (row) => (
                <Badge variant={
                  row.data.complianceStatus === 'compliant' ? 'success' :
                  row.data.complianceStatus === 'non-compliant' ? 'danger' :
                  row.data.complianceStatus === 'flagged' ? 'warning' : 'default'
                }>
                  {row.data.complianceStatus}
                </Badge>
              ),
              sortable: true,
            },
            {
              key: 'riskLevel',
              title: 'Risk Level',
              render: (row) => {
                const riskLevel = (row.data.riskLevel || 0) * 100;
                let variant = 'success';
                if (riskLevel >= 70) variant = 'danger';
                else if (riskLevel >= 50) variant = 'warning';
                else if (riskLevel >= 30) variant = 'default';

                return (
                  <Badge variant={variant}>
                    {riskLevel.toFixed(0)}%
                  </Badge>
                );
              },
              sortable: true,
            },
            {
              key: 'reviewed',
              title: 'Reviewed',
              render: (row) => (
                <span className={row.data.reviewed ? 'reviewed' : 'unreviewed'}>
                  {row.data.reviewed ? '✅' : '-'}
                </span>
              ),
              sortable: true,
            },
            {
              key: 'actions',
              title: 'Actions',
              render: (row) => (
                <div className="audit-log-actions">
                  <Button onClick={() => handleAuditLogClick(row.id)} variant="ghost" size="small">
                    View Details
                  </Button>
                </div>
              ),
              sortable: false,
            },
          ]}
          pagination={{
            page,
            pageSize,
            totalCount,
            hasMore,
            onPageChange: handlePageChange,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
          sort={{
            field: sortBy,
            direction: sortOrder,
            onSort: handleSortChange,
          }}
        />
      </div>

      {/* Details Modal */}
      {showDetails && selectedAuditLog && (
        <div className="audit-log-details-modal">
          <Card>
            <CardContent>
              <div className="details-header">
                <h2>Audit Log Details</h2>
                <Button onClick={handleCloseDetails} variant="ghost" size="small">
                  ✕
                </Button>
              </div>

              <div className="details-content">
                {auditLogs
                  .filter((row) => row.id === selectedAuditLog)
                  .map((row) => (
                    <div key={row.id} className="audit-log-detail">
                      <div className="detail-section">
                        <h3>Basic Information</h3>
                        <div className="detail-row">
                          <span className="detail-label">Audit Log ID:</span>
                          <span className="detail-value">{row.id}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Operation:</span>
                          <span className="detail-value">{row.data.operation.toUpperCase()}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Collection:</span>
                          <span className="detail-value">{row.data.collection}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Document ID:</span>
                          <span className="detail-value">{row.data.documentId}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">User:</span>
                          <span className="detail-value">{row.data.userEmail}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Firm ID:</span>
                          <span className="detail-value">{row.data.firmId}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Timestamp:</span>
                          <span className="detail-value">{new Date(row.data.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Duration:</span>
                          <span className="detail-value">{row.data.duration ? `${row.data.duration}ms` : '-'}</span>
                        </div>
                      </div>

                      <div className="detail-section">
                        <h3>Compliance & Risk</h3>
                        <div className="detail-row">
                          <span className="detail-label">Compliance Status:</span>
                          <span className="detail-value">
                            <Badge variant={
                              row.data.complianceStatus === 'compliant' ? 'success' :
                              row.data.complianceStatus === 'non-compliant' ? 'danger' :
                              row.data.complianceStatus === 'flagged' ? 'warning' : 'default'
                            }>
                              {row.data.complianceStatus}
                            </Badge>
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Risk Level:</span>
                          <span className="detail-value">
                            {(row.data.riskLevel || 0) * 100}%
                          </span>
                        </div>
                      </div>

                      <div className="detail-section">
                        <h3>Success & Error</h3>
                        <div className="detail-row">
                          <span className="detail-label">Success:</span>
                          <span className="detail-value">
                            <span className={row.data.success ? 'success' : 'failure'}>
                              {row.data.success ? '✅' : '❌'}
                            </span>
                          </span>
                        </div>
                        {row.data.errorMessage && (
                          <div className="detail-row">
                            <span className="detail-label">Error Message:</span>
                            <span className="detail-value error-message">{row.data.errorMessage}</span>
                          </div>
                        )}
                        {row.data.errorCode && (
                          <div className="detail-row">
                            <span className="detail-label">Error Code:</span>
                            <span className="detail-value">{row.data.errorCode}</span>
                          </div>
                        )}
                        {row.data.stackTrace && (
                          <div className="detail-row">
                            <span className="detail-label">Stack Trace:</span>
                            <span className="detail-value stack-trace">{row.data.stackTrace}</span>
                          </div>
                        )}
                      </div>

                      <div className="detail-section">
                        <h3>Before/After State</h3>
                        <div className="state-comparison">
                          <div className="state-before">
                            <h4>Before State</h4>
                            <pre>{JSON.stringify(row.data.beforeState, null, 2)}</pre>
                          </div>
                          <div className="state-after">
                            <h4>After State</h4>
                            <pre>{JSON.stringify(row.data.afterState, null, 2)}</pre>
                          </div>
                        </div>
                        {row.data.changes && Object.keys(row.data.changes).length > 0 && (
                          <div className="changes">
                            <h4>Changes</h4>
                            <ul>
                              {Object.entries(row.data.changes).map(([key, change]) => (
                                <li key={key}>
                                  <strong>{key}:</strong>
                                  {change.type === 'added' && (
                                    <span>Added: {JSON.stringify(change.value)}</span>
                                  )}
                                  {change.type === 'changed' && (
                                    <span>Changed from {JSON.stringify(change.from)} to {JSON.stringify(change.to)}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="detail-section">
                        <h3>Review</h3>
                        <div className="detail-row">
                          <span className="detail-label">Reviewed:</span>
                          <span className="detail-value">{row.data.reviewed ? '✅' : '-'}</span>
                        </div>
                        {row.data.reviewNotes && (
                          <div className="detail-row">
                            <span className="detail-label">Review Notes:</span>
                            <span className="detail-value">{row.data.reviewNotes}</span>
                          </div>
                        )}
                        {row.data.reviewedBy && (
                          <div className="detail-row">
                            <span className="detail-label">Reviewed By:</span>
                            <span className="detail-value">{row.data.reviewedBy}</span>
                          </div>
                        )}
                        {row.data.reviewedAt && (
                          <div className="detail-row">
                            <span className="detail-label">Reviewed At:</span>
                            <span className="detail-value">{new Date(row.data.reviewedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="detail-section">
                        <h3>Metadata</h3>
                        <div className="detail-row">
                          <span className="detail-label">Remote IP:</span>
                          <span className="detail-value">{row.data.remoteIp || '-'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">User Agent:</span>
                          <span className="detail-value">{row.data.userAgent || '-'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Request ID:</span>
                          <span className="detail-value">{row.data.requestId || '-'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Session ID:</span>
                          <span className="detail-value">{row.data.sessionId || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="details-footer">
                <Button onClick={handleCloseDetails} variant="secondary">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .audit-log-viewer {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .audit-log-viewer.unauthorized {
          text-align: center;
          padding: 4rem;
        }

        .audit-log-viewer.loading {
          text-align: center;
          padding: 4rem;
        }

        .audit-log-viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: var(--color-gray-50);
          border-radius: 0.5rem;
        }

        .audit-log-viewer-actions {
          display: flex;
          gap: 1rem;
        }

        .audit-log-viewer-summary {
          margin-bottom: 2rem;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .summary-cards .card {
          text-align: center;
        }

        .summary-cards .card h3 {
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          color: var(--color-gray-600);
        }

        .summary-cards .card p {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-primary);
        }

        .audit-log-viewer-filters {
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-radius: 0.5rem;
        }

        .audit-log-viewer-filters h2 {
          font-size: 1.125rem;
          margin-bottom: 1rem;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-gray-600);
        }

        .filter-actions {
          grid-column: 1 / -1;
          text-align: right;
        }

        .audit-log-viewer-results {
          margin-bottom: 2rem;
        }

        .audit-log-viewer-results h2 {
          font-size: 1.125rem;
          margin-bottom: 1rem;
        }

        .audit-log-id,
        .document-id {
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--color-gray-600);
        }

        .success {
          color: var(--color-success-green);
        }

        .failure {
          color: var(--color-error-red);
        }

        .reviewed {
          color: var(--color-success-green);
        font-weight: 600;
        }

        .unreviewed {
          color: var(--color-gray-400);
        font-style: italic;
        font-size: 0.875rem;
        font-weight: 400;
        font-family: monospace;
        font-size: 0.75rem;
        color: var(--color-gray-600);
        line-height: 1.5;
      }

        .error-message,
        .stack-trace {
          color: var(--color-error-red);
          background-color: var(--color-error-red-50);
          padding: 0.5rem;
          border-radius: 0.25rem;
        }

        .audit-log-actions {
          display: flex;
          gap: 0.5rem;
        }

        .audit-log-details-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 2rem;
        }

        .audit-log-details-modal .card {
          max-width: 800px;
          max-height: 80vh;
          overflow-y: auto;
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-gray-200);
        }

        .details-content {
          margin-bottom: 1rem;
        }

        .details-section {
          margin-bottom: 2rem;
        }

        .details-section h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          color: var(--color-primary);
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background-color: var(--color-gray-50);
          border-radius: 0.25rem;
        }

        .detail-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-gray-600);
        }

        .detail-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-gray-800);
        }

        .state-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .state-before,
        .state-after {
          padding: 1rem;
          background-color: var(--color-gray-50);
          border-radius: 0.5rem;
        }

        .state-before h4,
        .state-after h4 {
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          color: var(--color-primary);
        }

        .state-before pre,
        .state-after pre {
          background-color: var(--color-white);
          border: 1px solid var(--color-gray-200);
          border-radius: 0.25rem;
          padding: 0.5rem;
          font-size: 0.75rem;
          overflow-x: auto;
          line-height: 1.5;
        }

        .changes {
          margin-bottom: 1rem;
        }

        .changes h4 {
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
          color: var(--color-primary);
        }

        .changes ul {
          list-style: none;
          padding-left: 1rem;
        }

        .changes li {
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .changes li strong {
          font-weight: 600;
        }

        .details-footer {
          display: flex;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid var(--color-gray-200);
        }

        @media (max-width: 768px) {
          .audit-log-viewer {
            padding: 1rem;
          }

          .audit-log-viewer-header {
            flex-direction: column;
            gap: 1rem;
          }

          .audit-log-viewer-actions {
            width: 100%;
          flex-direction: column;
          gap: 0.5rem;
          text-align: left;
          grid-column: 1 / -1;
          filter-actions: {
            width: 100%;
            text-align: left;
          }
        }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .summary-cards {
            grid-template-columns: 1fr;
          }

          .state-comparison {
            grid-template-columns: 1fr;
          }
        }
      }
      `}</style>
    </div>
  );
}

export default AuditLogViewer;
