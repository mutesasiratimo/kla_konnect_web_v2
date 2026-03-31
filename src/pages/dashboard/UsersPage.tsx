import type { RoleRead, UserRead } from '../../api/types'
import { UserList } from '../../components/users/UserList'

interface UsersPageProps {
  usersLoadError: string | null
  userData: UserRead[]
  roleData: RoleRead[]
  onRefreshUsers: () => void | Promise<void>
}

export function UsersPage({
  usersLoadError,
  userData,
  roleData,
  onRefreshUsers,
}: UsersPageProps) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header-row">
        <div>
          <h1 className="dashboard-page-title">Users</h1>
          <p className="dashboard-page-lead">
            Manage platform users and access levels.
          </p>
        </div>
      </div>
      {usersLoadError && (
        <p className="dashboard-page-lead" style={{ color: '#ef4444' }}>
          {usersLoadError}
        </p>
      )}
      <UserList users={userData} roles={roleData} onRefresh={onRefreshUsers} />
    </div>
  )
}
