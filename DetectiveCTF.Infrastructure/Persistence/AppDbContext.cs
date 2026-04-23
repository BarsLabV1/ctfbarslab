using DetectiveCTF.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace DetectiveCTF.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Case> Cases { get; set; }
        public DbSet<Challenge> Challenges { get; set; }
        public DbSet<Evidence> Evidences { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<TeamMember> TeamMembers { get; set; }
        public DbSet<TeamCaseProgress> TeamCaseProgresses { get; set; }
        public DbSet<UserCaseProgress> UserCaseProgresses { get; set; }
        public DbSet<UserChallengeProgress> UserChallengeProgresses { get; set; }
        public DbSet<VMInstance> VMInstances { get; set; }
        public DbSet<BoardState> BoardStates { get; set; }
        public DbSet<BoardCard> BoardCards { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Case - Challenge relationship
            modelBuilder.Entity<Challenge>()
                .HasOne(c => c.Case)
                .WithMany(ca => ca.Challenges)
                .HasForeignKey(c => c.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            // Challenge - RequiredChallenge relationship
            modelBuilder.Entity<Challenge>()
                .HasOne(c => c.RequiredChallenge)
                .WithMany(c => c.DependentChallenges)
                .HasForeignKey(c => c.RequiredChallengeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Evidence - Challenge relationship
            modelBuilder.Entity<Evidence>()
                .HasOne(e => e.Challenge)
                .WithMany()
                .HasForeignKey(e => e.ChallengeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Team relationships
            modelBuilder.Entity<Team>()
                .HasOne(t => t.Leader)
                .WithMany(u => u.LeadingTeams)
                .HasForeignKey(t => t.LeaderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Team>()
                .HasIndex(t => t.InviteCode)
                .IsUnique();

            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(tm => tm.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.User)
                .WithMany(u => u.TeamMemberships)
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Progress relationships
            modelBuilder.Entity<UserChallengeProgress>()
                .HasOne(ucp => ucp.User)
                .WithMany(u => u.ChallengeProgresses)
                .HasForeignKey(ucp => ucp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserChallengeProgress>()
                .HasOne(ucp => ucp.Challenge)
                .WithMany(c => c.UserProgresses)
                .HasForeignKey(ucp => ucp.ChallengeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<VMInstance>()
                .HasOne(v => v.Challenge)
                .WithMany()
                .HasForeignKey(v => v.ChallengeId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<BoardCard>()
                .HasOne(b => b.Case)
                .WithMany()
                .HasForeignKey(b => b.CaseId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed data
            //SeedData(modelBuilder);
        }

    //    private void SeedData(ModelBuilder modelBuilder)
    //    {
    //        // Admin user
    //        modelBuilder.Entity<User>().HasData(
    //            new User
    //            {
    //                Id = 1,
    //                Username = "admin",
    //                Email = "admin@detectivectf.com",
    //                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
    //                IsAdmin = true,
    //                TotalScore = 0,
    //                CreatedAt = DateTime.UtcNow
    //            }
    //        );

    //        // Örnek vaka
    //        modelBuilder.Entity<Case>().HasData(
    //            new Case
    //            {
    //                Id = 1,
    //                Title = "Siber Suikast: Şirket İçi Komplo",
    //                Description = "Bir teknoloji CEO'su evinde ölü bulundu. Tüm kanıtlar dijital dünyada...",
    //                Story = "John Smith, büyük bir teknoloji şirketinin CEO'su, evinde ölü bulundu. Güvenlik kameraları, bilgisayar logları ve şirket içi sistemler incelenmeli. Her ipucu sizi bir sonraki adıma götürecek.",
    //                Difficulty = 3,
    //                TotalPoints = 1500,
    //                IsActive = true,
    //                CreatedAt = DateTime.UtcNow
    //            }
    //        );

    //        // Challenge 1: OSINT - Güvenlik Kamerası Analizi
    //        modelBuilder.Entity<Challenge>().HasData(
    //            new Challenge
    //            {
    //                Id = 1,
    //                CaseId = 1,
    //                Title = "Güvenlik Kamerası Kaydı",
    //                Description = "Olay gecesi güvenlik kamerası kaydını analiz edin. Video dosyasında şüpheli bir kişi görülüyor. Kim olduğunu bulun.",
    //                Category = "OSINT",
    //                Order = 1,
    //                Points = 100,
    //                Flag = "CTF{sarah_johnson_23:15}",
    //                HasVM = false,
    //                Files = @"[{""name"":""security_cam_23_00.mp4"",""url"":""/evidence/case1/security_cam.mp4"",""type"":""video""}]",
    //                Hints = @"[{""Text"":""Kamera kaydının 23:15 dakikasına dikkat edin"",""PenaltyPercent"":10},{""Text"":""Şüpheli kişinin yaka kartına bakın"",""PenaltyPercent"":25}]",
    //                UnlockContent = @"{""reportSection"":{""title"":""ŞÜPHELİ TESPİT EDİLDİ"",""type"":""suspect"",""content"":""Güvenlik kamerası analizi sonucunda 23:15'te binaya giren kişi tespit edildi. Yaka kartında 'Sarah Johnson - CFO' yazmaktadır. Şirketin mali işlerinden sorumlu olan Johnson, olay gecesi binada bulunduğunu inkâr etmişti.""},""boardSuspect"":{""name"":""Sarah Johnson"",""role"":""CFO"",""motive"":""Henüz belirsiz — mali kayıtlar incelenmeli""}}",
    //                CreatedAt = DateTime.UtcNow
    //            }
    //        );

    //        // Challenge 2: Forensics - Log Analizi
    //        modelBuilder.Entity<Challenge>().HasData(
    //            new Challenge
    //            {
    //                Id = 2,
    //                CaseId = 1,
    //                Title = "Sistem Log Analizi",
    //                Description = "Maktulün bilgisayarından alınan sistem loglarını inceleyin. Şüpheli aktiviteler var.",
    //                Category = "Forensics",
    //                Order = 2,
    //                Points = 150,
    //                Flag = "CTF{192.168.1.100_unauthorized_access}",
    //                RequiredChallengeId = 1,
    //                HasVM = false,
    //                Files = @"[{""name"":""system.log"",""url"":""/evidence/case1/system.log"",""type"":""document""}]",
    //                Hints = @"[{""Text"":""grep komutuyla 'FAILED' kelimesini arayın"",""PenaltyPercent"":10},{""Text"":""192.168.1.x aralığındaki IP'lere bakın"",""PenaltyPercent"":20}]",
    //                UnlockContent = @"{""reportSection"":{""title"":""YETKİSİZ ERİŞİM TESPİT EDİLDİ"",""type"":""evidence"",""content"":""Sistem logları incelendi. 192.168.1.100 IP adresinden gece 23:10-23:22 arasında CEO'nun bilgisayarına 14 başarısız giriş denemesi yapılmış, ardından 23:23'te erişim sağlanmıştır. Bu IP adresi şirket içi ağa aittir.""},""boardNote"":{""title"":""Kritik IP: 192.168.1.100"",""text"":""23:10-23:22 arası 14 başarısız giriş\n23:23'te erişim sağlandı\nŞirket içi ağ — kimin bilgisayarı?""}}",
    //                CreatedAt = DateTime.UtcNow
    //            }
    //        );

    //        // Challenge 3: Web - SSH Sunucu Hack
    //        modelBuilder.Entity<Challenge>().HasData(
    //            new Challenge
    //            {
    //                Id = 3,
    //                CaseId = 1,
    //                Title = "Şirket SSH Sunucusu",
    //                Description = "192.168.1.100 adresindeki SSH sunucusuna erişim sağlayın. Çalışan kayıtlarına ulaşın.",
    //                Category = "Web",
    //                Order = 3,
    //                Points = 250,
    //                Flag = "CTF{employee_access_granted}",
    //                RequiredChallengeId = 2,
    //                HasVM = true,
    //                DockerImage = "detectivectf/ssh-target:latest",
    //                VMConnectionInfo = @"{""port"":22,""username"":""admin"",""hint"":""Default credentials""}",
    //                Hints = @"[{""Text"":""Varsayılan şifreler genellikle admin:admin veya admin:password olur"",""PenaltyPercent"":15},{""Text"":""SSH bağlantısı için: ssh admin@192.168.1.100"",""PenaltyPercent"":30}]",
    //                UnlockContent = @"{""reportSection"":{""title"":""ÇALIŞAN KAYITLARINA ERİŞİLDİ"",""type"":""document"",""content"":""SSH sunucusuna erişim sağlandı. Çalışan kayıtları incelendi. Sarah Johnson'ın bilgisayarına (192.168.1.100) olay gecesi 23:10'da uzaktan bağlandığı tespit edildi. Ayrıca 'financial_report_Q3_DELETED.xlsx' adlı silinmiş bir dosya bulundu.""},""boardNote"":{""title"":""Silinmiş Dosya Bulundu"",""text"":""financial_report_Q3_DELETED.xlsx\nSilme tarihi: Olay gecesi 23:25\nKim sildi: s.johnson""}}",
    //                CreatedAt = DateTime.UtcNow
    //            }
    //        );

    //        // Challenge 4: Crypto - Şifreli Email
    //        modelBuilder.Entity<Challenge>().HasData(
    //            new Challenge
    //            {
    //                Id = 4,
    //                CaseId = 1,
    //                Title = "Şifreli Email Mesajı",
    //                Description = "Maktulün email hesabında şifreli bir mesaj bulundu. Şifreyi çözün.",
    //                Category = "Crypto",
    //                Order = 4,
    //                Points = 200,
    //                Flag = "CTF{financial_fraud_exposed}",
    //                RequiredChallengeId = 3,
    //                HasVM = false,
    //                Files = @"[{""name"":""encrypted_email.txt"",""url"":""/evidence/case1/encrypted.txt"",""type"":""document""}]",
    //                Hints = @"[{""Text"":""Caesar cipher ile şifrelenmiş olabilir"",""PenaltyPercent"":10},{""Text"":""ROT13 deneyin"",""PenaltyPercent"":25}]",
    //                UnlockContent = @"{""reportSection"":{""title"":""ŞİFRELİ MESAJ ÇÖZÜLDÜ — MALİ DOLANDIRICILIK"",""type"":""evidence"",""content"":""Şifreli email çözüldü. Mesaj içeriği: 'John her şeyi biliyor. Q3 raporunu imha et, yoksa ikimiz de biteriz. — S.J.' Mesaj, Sarah Johnson'ın kişisel email hesabından CEO'nun özel asistanı Michael Reed'e gönderilmiştir. Gönderim tarihi: Olay gününden 3 saat önce.""},""boardNote"":{""title"":""Şifreli Mesaj İçeriği"",""text"":""Gönderen: s.johnson@şirket.com\nAlıcı: m.reed@şirket.com\n'John her şeyi biliyor. Q3 raporunu imha et'\nGönderim: Olay gününden 3 saat önce""}}",
    //                CreatedAt = DateTime.UtcNow
    //            }
    //        );

    //        // Challenge 5: Final - Katili Bul
    //        modelBuilder.Entity<Challenge>().HasData(
    //            new Challenge
    //            {
    //                Id = 5,
    //                CaseId = 1,
    //                Title = "Katili Tespit Et",
    //                Description = "Tüm delilleri topladınız. Şimdi katili bulma zamanı. Katilin tam adını girin.",
    //                Category = "Final",
    //                Order = 5,
    //                Points = 800,
    //                Flag = "CTF{Sarah_Johnson}",
    //                RequiredChallengeId = 4,
    //                HasVM = false,
    //                Hints = @"[{""Text"":""Güvenlik kamerasında gördüğünüz kişiyi hatırlayın"",""PenaltyPercent"":20}]",
    //                UnlockContent = @"{""reportSection"":{""title"":""DAVA KAPATILDI — KATİL TESPİT EDİLDİ"",""type"":""suspect"",""content"":""Tüm dijital deliller Sarah Johnson'ı işaret etmektedir. Güvenlik kamerası kaydı, sistem logları, SSH erişim kayıtları ve şifreli email mesajı birlikte değerlendirildiğinde Johnson'ın CEO John Smith'i mali dolandırıcılığını örtbas etmek amacıyla öldürdüğü sonucuna varılmıştır. Tutuklama kararı çıkarıldı.""}}",
    //                CreatedAt = DateTime.UtcNow
    //            }
    //        );

    //        // Evidence - Video kayıtları
    //        modelBuilder.Entity<Evidence>().HasData(
    //            new Evidence
    //            {
    //                Id = 1,
    //                ChallengeId = 1,
    //                Title = "Güvenlik Kamerası - Ana Giriş",
    //                Type = "video",
    //                FileUrl = "/evidence/case1/cam1_23_00.mp4",
    //                Description = "23:00-23:30 arası ana giriş kamera kaydı",
    //                Metadata = @"{""duration"":""30:00"",""resolution"":""1920x1080"",""fps"":30}",
    //                Order = 1
    //            },
    //            new Evidence
    //            {
    //                Id = 2,
    //                ChallengeId = 1,
    //                Title = "Güvenlik Kamerası - Otopark",
    //                Type = "video",
    //                FileUrl = "/evidence/case1/cam2_23_00.mp4",
    //                Description = "23:00-23:30 arası otopark kamera kaydı",
    //                Metadata = @"{""duration"":""30:00"",""resolution"":""1280x720"",""fps"":25}",
    //                Order = 2
    //            },
    //            new Evidence
    //            {
    //                Id = 3,
    //                ChallengeId = 2,
    //                Title = "Sistem Access Log",
    //                Type = "document",
    //                FileUrl = "/evidence/case1/access.log",
    //                Description = "Son 24 saatin sistem erişim kayıtları",
    //                Order = 1
    //            }
    //        );
    //    }
    }
}
