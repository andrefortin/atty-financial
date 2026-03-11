/**
 * Matters Page (TanStack Query Example)
 *
 * Example showing how to use TanStack Query with the matters data
 */

import React, { useState } from 'react';
import { useMatters, useCreateMatter, useUpdateMatter, useDeleteMatter } from '../../hooks/useMatters';
import { useMatterMutations } from '../../hooks/useMatterMutations';
import { LoadingState } from '../../components/ui/LoadingState';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Matter, MatterStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/formatters';

/**
 * Matters Page Component with TanStack Query
 */
export const Matters: React.FC = () => {
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Query for fetching all matters
  const {
    data: matters,
    isLoading,
    isError,
    error,
  } = useMatters();

  // Mutation for creating matters
  const createMatterMutation = useCreateMatter();

  // Mutation for updating matters
  const updateMatterMutation = useUpdateMatter();

  // Mutation for deleting matters
  const deleteMatterMutation = useDeleteMatter();

  /**
   * Handle create matter
   */
  const handleCreateMatter = (data: { clientId: string; clientName: string }) => {
    createMatterMutation.mutate(data);
    setShowAddModal(false);
  };

  /**
   * Handle update matter
   */
  const handleUpdateMatter = (matter: Matter) => {
    updateMatterMutation.mutate(matter);
    setShowEditModal(false);
  };

  /**
   * Handle delete matter
   */
  const handleDeleteMatter = (id: string) => {
    if (confirm('Are you sure you want to delete this matter?')) {
      deleteMatterMutation.mutate(id);
    }
  };

  /**
   * Open edit modal
   */
  const openEditModal = (matter: Matter) => {
    setSelectedMatterId(matter.id);
    setShowEditModal(true);
  };

  /**
   * Calculate totals
   */
  const totals = React.useMemo(() => {
    if (!matters) return { totalPrincipal: 0, totalOwed: 0 };

    const totalPrincipal = matters.reduce((sum, matter) => sum + matter.principalBalance, 0);
    const totalOwed = matters.reduce((sum, matter) => sum + matter.interestOwed, 0);

    return { totalPrincipal, totalOwed };
  }, [matters]);

  /**
   * Filter matters by status
   */
  const activeMatters = React.useMemo(
    () => matters?.filter(m => m.status === 'Active') || [],
    [matters]
  );

  const closedMatters = React.useMemo(
    () => matters?.filter(m => m.status === 'Closed') || [],
    [matters]
  );

  const archivedMatters = React.useMemo(
    () => matters?.filter(m => m.status === 'Archive') || [],
    [matters]
  );

  if (isError) {
    return (
      <div style={{ padding: 'var(--spacing-8)' }}>
        <Card>
          <CardContent>
            <p style={{ color: 'var(--color-error-dark)' }}>
              Error loading matters: {error?.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--spacing-8)' }}>
        <LoadingState message="Loading matters..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-6)' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--color-primary-black)' }}>
          Matters
        </h1>

        {/* Create Button */}
        <Button
          onClick={() => setShowAddModal(true)}
          disabled={createMatterMutation.isPending}
          style={{ minWidth: '150px' }}
        >
          {createMatterMutation.isPending ? 'Creating...' : 'Create Matter'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
        {/* Total Principal */}
        <Card>
          <CardHeader>
            <CardTitle>Total Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-black)', margin: 0 }}>
              {formatCurrency(totals.totalPrincipal)}
            </p>
          </CardContent>
        </Card>

        {/* Total Owed */}
        <Card>
          <CardHeader>
            <CardTitle>Total Owed</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-secondary-melon)', margin: 0 }}>
              {formatCurrency(totals.totalOwed)}
            </p>
          </CardContent>
        </Card>

        {/* Active Matters */}
        <Card>
          <CardHeader>
            <CardTitle>Active Matters</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
              {activeMatters.length}
            </p>
            <p style={{ color: 'var(--color-gray-500)' }}>
              Active matters
            </p>
          </CardContent>
        </Card>

        {/* Closed Matters */}
        <Card>
          <CardHeader>
            <CardTitle>Closed Matters</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
              {closedMatters.length}
            </p>
            <p style={{ color: 'var(--color-gray-500)' }}>
              Closed matters
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Matters List */}
      <div style={{
        backgroundColor: 'var(--color-primary-white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: 'var(--spacing-6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--spacing-2)',
          paddingBottom: 'var(--spacing-4)',
          borderBottom: '1px solid var(--color-primary-gray)',
        }}>
          <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
            Client
          </div>
          <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
            Status
          </div>
          <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
            Balance
          </div>
          <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
            Owed
          </div>
        </div>

        {/* Matters */}
        {matters?.map((matter) => (
          <div
            key={matter.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'var(--spacing-2)',
              padding: 'var(--spacing-4)',
              borderBottom: '1px solid var(--color-primary-sand-light)',
              '&:hover': {
                backgroundColor: 'var(--color-primary-sand)',
              },
            }}
          >
            <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-primary-black)' }}>
              {matter.clientName}
            </div>
            <Badge
              variant={matter.status === 'Active' ? 'success' : matter.status === 'Closed' ? 'warning' : 'default'}
            >
              {matter.status}
            </Badge>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-black)' }}>
              {formatCurrency(matter.principalBalance)}
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-secondary-melon)' }}>
              {formatCurrency(matter.interestOwed)}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openEditModal(matter)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDeleteMatter(matter.id)}
                disabled={deleteMatterMutation.isPending}
                style={{ marginLeft: 'auto' }}
              >
                {deleteMatterMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Matter Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 'var(--z-index-modal)',
          }}
          >
          <Card style={{ maxWidth: '500px', width: '100%' }}>
            <CardHeader>
              <CardTitle>Create New Matter</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateMatter({
                  clientId: formData.get('clientId') as string,
                  clientName: formData.get('clientName') as string,
                });
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <div>
                    <label
                      htmlFor="clientId"
                      style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-2)', color: 'var(--color-primary-black)' }}
                    >
                      Client ID
                    </label>
                    <input
                      type="text"
                      id="clientId"
                      name="clientId"
                      required
                      placeholder="Enter client ID"
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-2)',
                        border: '1px solid var(--color-primary-gray)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-base)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="clientName"
                      style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-2)', color: 'var(--color-primary-black)' }}
                    >
                      Client Name
                    </label>
                    <input
                      type="text"
                      id="clientName"
                      name="clientName"
                      required
                      placeholder="Enter client name"
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-2)',
                        border: '1px solid var(--color-primary-gray)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-base)',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
                  <Button
                    type="submit"
                    disabled={createMatterMutation.isPending}
                    style={{ minWidth: '100px' }}
                  >
                    {createMatterMutation.isPending ? 'Creating...' : 'Create Matter'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Matter Modal */}
      {showEditModal && selectedMatterId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 'var(--z-index-modal)',
          }}
        >
          <Card style={{ maxWidth: '500px', width: '100%' }}>
            <CardHeader>
              <CardTitle>Edit Matter</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateMatter({
                  id: selectedMatterId,
                  status: formData.get('status') as MatterStatus,
                  notes: formData.get('notes') as string,
                });
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                  <div>
                    <label
                      htmlFor="status"
                      style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-2)', color: 'var(--color-primary-black)' }}
                    >
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      required
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-2)',
                        border: '1px solid var(--color-primary-gray)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-base)',
                        backgroundColor: 'var(--color-primary-white)',
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="Closed">Closed</option>
                      <option value="Archive">Archive</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="notes"
                      style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-2)', color: 'var(--color-primary-black)' }}
                    >
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      placeholder="Enter notes (optional)"
                      style={{
                        width: '100%',
                        padding: 'var(--spacing-2)',
                        border: '1px solid var(--color-primary-gray)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-base)',
                        fontFamily: 'var(--font-family-base)',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
                  <Button
                    type="submit"
                    disabled={updateMatterMutation.isPending}
                    style={{ minWidth: '100px' }}
                  >
                    {updateMatterMutation.isPending ? 'Updating...' : 'Update Matter'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Matters;
