import { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle2, XCircle, Shield, MapPin, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import authService from '../services/authService';
import userService from '../services/userService';

export default function AdminUserManagement() {
  const currentUser = authService.getCurrentUser();

  // Helpers to pick correct identifiers from MongoDB/Firebase
  const getUserId = (u) => u?._id || u?.firebaseUid || u?.id || '';
  const getMongoId = (u) => u?._id || u?.id || '';
  const getDeleteId = (u) => u?._id || u?.firebaseUid || u?.id || '';

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // '', 'user', 'deliveryboy', 'admin'
  const [statusFilter, setStatusFilter] = useState(''); // '', 'pending', 'approved', 'rejected'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);

  const [pendingAction, setPendingAction] = useState(null); // {type, userId}
  const [modal, setModal] = useState(null); // { type: 'reject'|'role'|'areas'|'delete', user, payload }
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      window.location.href = '/login';
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userService.searchUsers({ query, role: roleFilter, status: statusFilter, page, limit });
      // Transform backend data to add computed status and areas
      const usersWithStatus = res.users.map(user => ({
        ...user,
        status: user.isActive === true ? 'approved' : user.isActive === false ? 'rejected' : 'pending',
        areas: [
          ...(user.assignedAreas?.pincodes || []),
          ...(user.assignedAreas?.districts || [])
        ]
      }));
      setUsers(usersWithStatus);
      setTotal(res.total);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const doApprove = async (userId) => {
    setPendingAction({ type: 'approve', userId });
    setError('');
    try {
      await userService.approveUser(userId);
      await fetchUsers();
    } catch (e) {
      setError(e.message || 'Failed to approve user');
    } finally {
      setPendingAction(null);
    }
  };

  const doReject = async (userId, reason) => {
    setPendingAction({ type: 'reject', userId });
    setError('');
    try {
      await userService.rejectUser(userId, reason || '');
      await fetchUsers();
    } catch (e) {
      setError(e.message || 'Failed to reject user');
    } finally {
      setPendingAction(null);
      setModal(null);
    }
  };

  const doUpdateRole = async (userId, role) => {
    setPendingAction({ type: 'role', userId });
    setError('');
    try {
      await userService.updateUserRole(userId, role);
      await fetchUsers();
    } catch (e) {
      setError(e.message || 'Failed to update role');
    } finally {
      setPendingAction(null);
      setModal(null);
    }
  };

  const doUpdateAreas = async (userId, areas) => {
    setPendingAction({ type: 'areas', userId });
    setError('');
    try {
      await userService.updateUserAreas(userId, areas);
      await fetchUsers();
    } catch (e) {
      setError(e.message || 'Failed to update areas');
    } finally {
      setPendingAction(null);
      setModal(null);
    }
  };

  const isActingOn = (type, userId) => pendingAction && pendingAction.type === type && pendingAction.userId === userId;

  const doDelete = async (userId) => {
    if (!window.confirm('Delete this user from Firebase, Firestore, and MongoDB? This cannot be undone.')) return;
    setPendingAction({ type: 'delete', userId });
    setError('');
    try {
      await userService.deleteUser(userId);
      await fetchUsers();
    } catch (e) {
      setError(e.message || 'Failed to delete user');
    } finally {
      setPendingAction(null);
      setModal(null);
    }
  };

  const cardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb'
  };

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>User Management</h2>
      <form onSubmit={onSearch} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
          <Search size={18} color="#6b7280" />
          <input
            placeholder="Search name, email, phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', marginLeft: '0.5rem' }}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="deliveryboy">Delivery</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button type="submit" style={{ padding: '0.6rem 0.9rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Search</button>
      </form>
    </div>
  );

  const table = (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>User</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Contact</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Role</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Areas</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                <Loader2 className="spin" size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Loading users...
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No users found</td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={getMongoId(u) || u.firebaseUid}>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e5e7eb' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'N/A'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{u.firebaseUid || u._id || u.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ color: '#374151' }}>{u.email || '-'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{u.phone || '-'}</div>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ textTransform: 'capitalize' }}>{u.role || 'user'}</span>
                  <button
                    onClick={() => setModal({ type: 'role', user: u })}
                    style={{ marginLeft: 8, padding: '0.25rem 0.5rem', fontSize: 12, background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}
                  >
                    <Shield size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Change
                  </button>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(u.areas || u.area || []).map((a, i) => (
                      <span key={i} style={{ background: '#ecfeff', color: '#155e75', border: '1px solid #a5f3fc', padding: '0.15rem 0.4rem', borderRadius: 6, fontSize: 12 }}>{a}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => setModal({ type: 'areas', user: u })}
                    style={{ marginTop: 6, padding: '0.25rem 0.5rem', fontSize: 12, background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}
                  >
                    <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Edit areas
                  </button>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: 6,
                    fontSize: 12,
                    color: (u.status || '').toLowerCase() === 'approved' ? '#065f46' : (u.status || '').toLowerCase() === 'rejected' ? '#7f1d1d' : '#92400e',
                    background: (u.status || '').toLowerCase() === 'approved' ? '#d1fae5' : (u.status || '').toLowerCase() === 'rejected' ? '#fee2e2' : '#fef3c7',
                    border: '1px solid',
                    borderColor: (u.status || '').toLowerCase() === 'approved' ? '#a7f3d0' : (u.status || '').toLowerCase() === 'rejected' ? '#fecaca' : '#fde68a',
                    textTransform: 'capitalize'
                  }}>
                    {u.status || 'pending'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      disabled={isActingOn('approve', getUserId(u))}
                      onClick={() => doApprove(getUserId(u))}
                      style={{ padding: '0.4rem 0.6rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: 6, cursor: 'pointer' }}
                    >
                      {isActingOn('approve', getUserId(u)) ? <Loader2 className="spin" size={14} style={{ verticalAlign: 'middle' }} /> : <CheckCircle2 size={14} style={{ verticalAlign: 'middle' }} />} Approve
                    </button>
                    <button
                      disabled={isActingOn('reject', getUserId(u))}
                      onClick={() => setModal({ type: 'reject', user: u })}
                      style={{ padding: '0.4rem 0.6rem', background: '#fef2f2', color: '#7f1d1d', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer' }}
                    >
                      <XCircle size={14} style={{ verticalAlign: 'middle' }} /> Reject
                    </button>
                    <button
                      disabled={isActingOn('delete', getDeleteId(u))}
                      onClick={() => doDelete(getDeleteId(u))}
                      style={{ padding: '0.4rem 0.6rem', background: '#fff7ed', color: '#7c2d12', border: '1px solid #fed7aa', borderRadius: 6, cursor: 'pointer' }}
                    >
                      {isActingOn('delete', getDeleteId(u)) ? <Loader2 className="spin" size={14} style={{ verticalAlign: 'middle' }} /> : <Trash2 size={14} style={{ verticalAlign: 'middle' }} />} Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const pagination = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
      <div style={{ color: '#6b7280', fontSize: 14 }}>Page {page} of {totalPages} • {total} users</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ padding: '0.4rem 0.6rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
          <ChevronLeft size={16} />
        </button>
        <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ padding: '0.4rem 0.6rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }}>
          <ChevronRight size={16} />
        </button>
        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} style={{ padding: '0.4rem 0.6rem', border: '1px solid #e5e7eb', borderRadius: 6 }}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  );

  const errorBanner = error ? (
    <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.8rem', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#7f1d1d', display: 'flex', alignItems: 'center', gap: 8 }}>
      <AlertTriangle size={16} /> {error}
    </div>
  ) : null;

  const modalView = modal ? (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 420, padding: 16, border: '1px solid #e5e7eb' }}>
        {modal.type === 'reject' && (
          <RejectModal user={modal.user} onClose={() => setModal(null)} onConfirm={(reason) => doReject(getUserId(modal.user), reason)} loading={isActingOn('reject', getUserId(modal.user))} />
        )}
        {modal.type === 'role' && (
          <RoleModal user={modal.user} onClose={() => setModal(null)} onConfirm={(role) => doUpdateRole(getUserId(modal.user), role)} loading={isActingOn('role', getUserId(modal.user))} />
        )}
        {modal.type === 'areas' && (
          <AreasModal user={modal.user} onClose={() => setModal(null)} onConfirm={(areas) => doUpdateAreas(getUserId(modal.user), areas)} loading={isActingOn('areas', getUserId(modal.user))} />
        )}
      </div>
    </div>
  ) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {errorBanner}
        <div style={cardStyle}>
          {header}
          {table}
          {pagination}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {modalView}
    </div>
  );
}

function RejectModal({ user, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Reject user</h3>
      <p style={{ color: '#6b7280', marginTop: 0 }}>User: <strong>{user.displayName || user.email || user.uid || user.id}</strong></p>
      <textarea
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button onClick={onClose} style={{ padding: '0.5rem 0.75rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
        <button disabled={loading} onClick={() => onConfirm(reason)} style={{ padding: '0.5rem 0.75rem', background: '#ef4444', border: '1px solid #fecaca', color: 'white', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

function RoleModal({ user, onClose, onConfirm, loading }) {
  const [role, setRole] = useState(user.role || 'user');
  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Change role</h3>
      <p style={{ color: '#6b7280', marginTop: 0 }}>User: <strong>{user.displayName || user.email || user.uid || user.id}</strong></p>
      <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <option value="user">User</option>
        <option value="deliveryboy">Delivery</option>
        <option value="admin">Admin</option>
      </select>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button onClick={onClose} style={{ padding: '0.5rem 0.75rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
        <button disabled={loading} onClick={() => onConfirm(role)} style={{ padding: '0.5rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Updating...' : 'Update'}
        </button>
      </div>
    </div>
  );
}

function AreasModal({ user, onClose, onConfirm, loading }) {
  const [text, setText] = useState((user.areas || user.area || []).join(', '));
  const parseAreas = (s) => s.split(',').map(x => x.trim()).filter(Boolean);

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Edit areas</h3>
      <p style={{ color: '#6b7280', marginTop: 0 }}>User: <strong>{user.displayName || user.email || user.uid || user.id}</strong></p>
      <textarea
        placeholder="Enter comma-separated areas (e.g., Kochi, Thrissur)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, color: '#6b7280', fontSize: 12 }}>
        <span>Preview: {parseAreas(text).map((a, i) => (<span key={i} style={{ marginRight: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.1rem 0.4rem' }}>{a}</span>))}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button onClick={onClose} style={{ padding: '0.5rem 0.75rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
        <button disabled={loading} onClick={() => onConfirm(parseAreas(text))} style={{ padding: '0.5rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}