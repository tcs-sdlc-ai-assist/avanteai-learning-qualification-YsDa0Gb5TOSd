using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Backend.Models;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Program> Programs => Set<Program>();
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<PolicyVersion> PolicyVersions => Set<PolicyVersion>();
    public DbSet<Evidence> Evidences => Set<Evidence>();
    public DbSet<EvidenceBatch> EvidenceBatches => Set<EvidenceBatch>();
    public DbSet<ExceptionRecord> ExceptionRecords => Set<ExceptionRecord>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Alert> Alerts => Set<Alert>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUser(modelBuilder);
        ConfigureProgram(modelBuilder);
        ConfigurePolicy(modelBuilder);
        ConfigurePolicyVersion(modelBuilder);
        ConfigureEvidenceBatch(modelBuilder);
        ConfigureEvidence(modelBuilder);
        ConfigureExceptionRecord(modelBuilder);
        ConfigureAuditLog(modelBuilder);
        ConfigureAlert(modelBuilder);
    }

    private static void ConfigureUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");

            entity.HasKey(u => u.Id);

            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(256);

            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.Property(u => u.PasswordHash)
                .IsRequired()
                .HasMaxLength(512);

            entity.Property(u => u.FullName)
                .IsRequired()
                .HasMaxLength(256);

            entity.Property(u => u.Role)
                .IsRequired()
                .HasConversion(new EnumToStringConverter<UserRole>())
                .HasMaxLength(32);

            entity.Property(u => u.CreatedAt)
                .IsRequired();

            entity.Property(u => u.UpdatedAt)
                .IsRequired();
        });
    }

    private static void ConfigureProgram(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Program>(entity =>
        {
            entity.ToTable("Programs");

            entity.HasKey(p => p.Id);

            entity.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(p => p.Name);

            entity.Property(p => p.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(p => p.Status)
                .IsRequired()
                .HasConversion(new EnumToStringConverter<ProgramStatus>())
                .HasColumnType("varchar(20)");

            entity.Property(p => p.CreatedBy)
                .IsRequired();

            entity.Property(p => p.CreatedAt)
                .IsRequired();

            entity.Property(p => p.UpdatedAt)
                .IsRequired();

            entity.HasMany(p => p.Policies)
                .WithOne(pol => pol.Program)
                .HasForeignKey(pol => pol.ProgramId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigurePolicy(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Policy>(entity =>
        {
            entity.ToTable("Policies");

            entity.HasKey(p => p.Id);

            entity.Property(p => p.ProgramId)
                .IsRequired();

            entity.HasIndex(p => p.ProgramId);

            entity.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(p => p.Name);

            entity.Property(p => p.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(p => p.Rules)
                .IsRequired()
                .HasColumnType("jsonb");

            entity.Property(p => p.Status)
                .IsRequired()
                .HasConversion(new EnumToStringConverter<PolicyStatus>())
                .HasMaxLength(20);

            entity.HasIndex(p => p.Status);

            entity.Property(p => p.CurrentVersion)
                .IsRequired();

            entity.Property(p => p.CreatedBy)
                .IsRequired();

            entity.Property(p => p.CreatedAt)
                .IsRequired();

            entity.Property(p => p.UpdatedAt)
                .IsRequired();

            entity.Property(p => p.RowVersion)
                .IsRowVersion();

            entity.HasOne(p => p.Program)
                .WithMany(pr => pr.Policies)
                .HasForeignKey(p => p.ProgramId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(p => p.PolicyVersions)
                .WithOne(pv => pv.Policy)
                .HasForeignKey(pv => pv.PolicyId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigurePolicyVersion(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PolicyVersion>(entity =>
        {
            entity.ToTable("PolicyVersions");

            entity.HasKey(pv => pv.Id);

            entity.Property(pv => pv.PolicyId)
                .IsRequired();

            entity.HasIndex(pv => pv.PolicyId);

            entity.HasIndex(pv => new { pv.PolicyId, pv.VersionNumber })
                .IsUnique();

            entity.Property(pv => pv.VersionNumber)
                .IsRequired()
                .HasColumnName("Version");

            entity.Property(pv => pv.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(pv => pv.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(pv => pv.Rules)
                .IsRequired()
                .HasColumnType("jsonb");

            entity.Property(pv => pv.CreatedAt)
                .IsRequired();

            entity.Property(pv => pv.CreatedBy)
                .IsRequired();

            entity.HasOne(pv => pv.Policy)
                .WithMany(p => p.PolicyVersions)
                .HasForeignKey(pv => pv.PolicyId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureEvidenceBatch(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EvidenceBatch>(entity =>
        {
            entity.ToTable("EvidenceBatches");

            entity.HasKey(eb => eb.Id);

            entity.Property(eb => eb.FileName)
                .IsRequired()
                .HasMaxLength(256);

            entity.Property(eb => eb.UploadedBy)
                .IsRequired()
                .HasMaxLength(64);

            entity.Property(eb => eb.UploadedAt)
                .IsRequired();

            entity.Property(eb => eb.RecordCount)
                .IsRequired();

            entity.Property(eb => eb.Status)
                .IsRequired()
                .HasConversion(new EnumToStringConverter<BatchStatus>())
                .HasColumnType("varchar(32)");

            entity.HasIndex(eb => eb.Status);

            entity.HasMany(eb => eb.Evidences)
                .WithOne(e => e.Batch)
                .HasForeignKey(e => e.BatchId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureEvidence(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Evidence>(entity =>
        {
            entity.ToTable("Evidences");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.BatchId)
                .IsRequired();

            entity.HasIndex(e => e.BatchId);

            entity.Property(e => e.EmployeeId)
                .IsRequired()
                .HasMaxLength(32);

            entity.HasIndex(e => e.EmployeeId);

            entity.Property(e => e.EmployeeName)
                .IsRequired()
                .HasMaxLength(128);

            entity.Property(e => e.CourseName)
                .IsRequired()
                .HasMaxLength(128);

            entity.Property(e => e.CompletionDate)
                .IsRequired();

            entity.Property(e => e.Status)
                .IsRequired()
                .HasConversion(new EnumToStringConverter<EvidenceStatus>())
                .HasMaxLength(20);

            entity.HasIndex(e => e.Status);

            entity.Property(e => e.ConfidenceScore)
                .HasColumnType("decimal(5,2)");

            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.HasOne(e => e.Batch)
                .WithMany(eb => eb.Evidences)
                .HasForeignKey(e => e.BatchId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureExceptionRecord(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ExceptionRecord>(entity =>
        {
            entity.ToTable("Exception");

            entity.HasKey(er => er.Id);

            entity.Property(er => er.Id)
                .HasColumnName("ExceptionId")
                .ValueGeneratedOnAdd();

            entity.Property(er => er.EvidenceId)
                .IsRequired()
                .HasColumnName("EvidenceId");

            entity.HasIndex(er => er.EvidenceId);

            entity.Property(er => er.Reason)
                .IsRequired()
                .HasMaxLength(256)
                .HasColumnName("Reason");

            entity.Property(er => er.Status)
                .IsRequired()
                .HasConversion(new EnumToStringConverter<ExceptionStatus>())
                .HasMaxLength(32)
                .HasColumnName("Status");

            entity.HasIndex(er => er.Status);

            entity.Property(er => er.Justification)
                .HasColumnName("Justification");

            entity.Property(er => er.ReviewerId)
                .HasMaxLength(64)
                .HasColumnName("ReviewedBy");

            entity.Property(er => er.ReviewedAt)
                .HasColumnName("ReviewedAt");

            entity.Property(er => er.SlaDeadline)
                .IsRequired()
                .HasColumnName("SlaDeadline");

            entity.HasIndex(er => er.SlaDeadline);

            entity.Property(er => er.CreatedAt)
                .IsRequired()
                .HasColumnName("CreatedAt");
        });
    }

    private static void ConfigureAuditLog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs");

            entity.HasKey(al => al.Id);

            entity.Property(al => al.UserId)
                .IsRequired()
                .HasMaxLength(128);

            entity.HasIndex(al => al.UserId);

            entity.Property(al => al.UserName)
                .IsRequired()
                .HasMaxLength(128);

            entity.Property(al => al.ActionType)
                .IsRequired()
                .HasMaxLength(32);

            entity.HasIndex(al => al.ActionType);

            entity.Property(al => al.Entity)
                .IsRequired()
                .HasMaxLength(64);

            entity.HasIndex(al => al.Entity);

            entity.Property(al => al.EntityId)
                .IsRequired()
                .HasMaxLength(128);

            entity.Property(al => al.Timestamp)
                .IsRequired();

            entity.HasIndex(al => al.Timestamp);

            entity.Property(al => al.Details)
                .HasMaxLength(2048);

            entity.HasIndex(al => new { al.Entity, al.EntityId });
        });
    }

    private static void ConfigureAlert(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Alert>(entity =>
        {
            entity.ToTable("Alerts");

            entity.HasKey(a => a.Id);

            entity.Property(a => a.UserId)
                .IsRequired();

            entity.HasIndex(a => a.UserId);

            entity.Property(a => a.Type)
                .IsRequired()
                .HasMaxLength(32);

            entity.Property(a => a.Message)
                .IsRequired()
                .HasMaxLength(2048);

            entity.Property(a => a.IsRead)
                .IsRequired()
                .HasDefaultValue(false);

            entity.HasIndex(a => a.IsRead);

            entity.Property(a => a.CreatedAt)
                .IsRequired();

            entity.HasIndex(a => a.CreatedAt);

            entity.HasIndex(a => new { a.UserId, a.IsRead });
        });
    }
}