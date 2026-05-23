# volume_ctfbarslab_db_data_attached

Server: localhost,11436
Database: ctfbarslab_db_data_DetectiveCTFDb
Note: ctfbarslab_db_data volume kopyasi attach edildi


## Tables

| TABLE_SCHEMA | TABLE_NAME |
| --- | --- |
| dbo | __EFMigrationsHistory |
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

Rows: 1

| MigrationId | ProductVersion |
| --- | --- |
| 20260423100359__init | 10.0.7 |

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

| Id | Title | Description | Story | Difficulty | TotalPoints | ImageUrl | IsActive | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## dbo.Challenges

Rows: 0

| Id | CaseId | Title | Description | Category | Order | Points | Flag | RequiredChallengeId | HasVM | DockerImage | VMConnectionInfo | Files | Hints | UnlockContent | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

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

Rows: 2

| Id | Username | Email | PasswordHash | TotalScore | IsAdmin | PreferredRole | CreatedAt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | taha | taha@gmail.com | [MASKED] | 0 | False |  | 04/23/2026 20:51:23 |
| 2 | aga | aga@gmail.com | [MASKED] | 0 | False |  | 04/25/2026 04:37:51 |

## dbo.VMInstances

Rows: 0

| Id | ChallengeId | UserId | TeamId | ContainerId | ContainerName | IPAddress | Port | Status | CreatedAt | ExpiresAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
