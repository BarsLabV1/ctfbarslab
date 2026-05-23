# volume_bars_db_data_attached

Server: localhost,11436
Database: bars_db_data_DetectiveCTFDb
Note: bars_db_data volume kopyasi attach edildi


## Tables

| TABLE_SCHEMA | TABLE_NAME |
| --- | --- |
| dbo | __EFMigrationsHistory |
| dbo | ActiveInstances |
| dbo | BoardCards |
| dbo | BoardStates |
| dbo | Cases |
| dbo | Challenges |
| dbo | Evidences |
| dbo | TeamCaseProgresses |
| dbo | TeamMembers |
| dbo | Teams |
| dbo | UserCaseProgresses |
| dbo | UserChallengeProgresses |
| dbo | Users |
| dbo | VMInstances |

## dbo.__EFMigrationsHistory

Rows: 2

| MigrationId | ProductVersion |
| --- | --- |
| 20260423100359__init | 10.0.7 |
| 20260509133825_AddActiveInstances | 10.0.7 |

## dbo.ActiveInstances

Rows: 0

| Id | UserId | ContainerId | ContainerName | AssignedPort | VncUrl | CreatedAt | ExpiryDate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.BoardCards

Rows: 0

| Id | CaseId | Type | Title | Content | FileUrl | ExternalUrl | DockerImage | PosX | PosY | Rotation | Color | UnlockedByChallenge | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.BoardStates

Rows: 0

| Id | CaseId | TeamId | UserId | StateJson | UpdatedAt |
| --- | --- | --- | --- | --- | --- |

## dbo.Cases

Rows: 0

| Id | Title | Description | Story | Difficulty | TotalPoints | ImageUrl | IsActive | CreatedAt | DockerImage | Domain | HasVM |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.Challenges

Rows: 0

| Id | CaseId | Title | Description | Category | Order | Points | Flag | RequiredChallengeId | HasVM | DockerImage | VMConnectionInfo | Files | Hints | UnlockContent | CreatedAt | ImageUrl | PosX | PosY |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.Evidences

Rows: 0

| Id | ChallengeId | Title | Type | FileUrl | Description | Metadata | Order |
| --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.TeamCaseProgresses

Rows: 0

| Id | TeamId | CaseId | IsCompleted | Score | StartedAt | CompletedAt |
| --- | --- | --- | --- | --- | --- | --- |

## dbo.TeamMembers

Rows: 0

| Id | TeamId | UserId | Role | JoinedAt |
| --- | --- | --- | --- | --- |

## dbo.Teams

Rows: 0

| Id | Name | Description | LeaderId | MaxMembers | TotalScore | IsActive | InviteCode | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.UserCaseProgresses

Rows: 0

| Id | UserId | CaseId | IsCompleted | Score | StartedAt | CompletedAt | HackedSystemIds | DiscoveredClueIds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.UserChallengeProgresses

Rows: 0

| Id | UserId | ChallengeId | TeamId | IsSolved | Attempts | SolvedAt | StartedAt | AssignedVMId | VMConnectionDetails | UsedHints |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.Users

Rows: 1

| Id | Username | Email | PasswordHash | TotalScore | IsAdmin | PreferredRole | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | taha | taha@pery.com | [MASKED] | 0 | False |  | 05/19/2026 17:30:36 |

## dbo.VMInstances

Rows: 0

| Id | ChallengeId | UserId | TeamId | ContainerId | ContainerName | IPAddress | Port | Status | CreatedAt | ExpiresAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
