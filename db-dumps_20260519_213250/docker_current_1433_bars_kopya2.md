# docker_current_1433_bars_kopya2

Server: localhost,1433
Database: DetectiveCTFDb
Note: Su anki docker compose SQL volume: bars-kopya2_db_data


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
| 1 | taha | taha@gmail.com | [MASKED] | 0 | False |  | 04/30/2026 12:57:29 |

## dbo.VMInstances

Rows: 2

| Id | ChallengeId | UserId | TeamId | ContainerId | ContainerName | IPAddress | Port | Status | CreatedAt | ExpiresAt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 |  | 1 |  | b139147717457756e4b600f482c42ad0f0415db1291d74085b10ab95eca776b3 | ctf_kali_u1_53b443 | 10.10.74.179 | 32770 | stopped | 04/30/2026 12:58:08 | 04/30/2026 16:58:08 |
| 2 |  | 1 |  | 3a85528a8e005940765f780579b757fbb3b55a0307ac60d0f47a3f55572678f5 | ctf_kali_u1_35d2c8 | 10.10.74.179 | 32768 | stopped | 05/14/2026 13:26:07 | 05/14/2026 17:26:07 |
