using Backend.Services.Parsing;

namespace Backend.Services.Parsing;

public class FileParserFactory : IFileParserFactory
{
    private readonly IReadOnlyList<IFileParser> _parsers;

    public FileParserFactory(IEnumerable<IFileParser> parsers)
    {
        _parsers = parsers?.ToList().AsReadOnly()
            ?? throw new ArgumentNullException(nameof(parsers));
    }

    /// <inheritdoc />
    public IFileParser GetParser(string fileExtension)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fileExtension, nameof(fileExtension));

        var normalized = fileExtension.Trim().ToLowerInvariant();

        if (!normalized.StartsWith('.'))
        {
            normalized = $".{normalized}";
        }

        var parser = _parsers.FirstOrDefault(p =>
            p.SupportedExtensions.Any(ext =>
                ext.Equals(normalized, StringComparison.OrdinalIgnoreCase)));

        if (parser is null)
        {
            throw new NotSupportedException(
                $"No parser available for file extension '{fileExtension}'. Supported extensions: {string.Join(", ", GetAllSupportedExtensions())}.");
        }

        return parser;
    }

    /// <inheritdoc />
    public bool CanParse(string fileExtension)
    {
        if (string.IsNullOrWhiteSpace(fileExtension))
        {
            return false;
        }

        var normalized = fileExtension.Trim().ToLowerInvariant();

        if (!normalized.StartsWith('.'))
        {
            normalized = $".{normalized}";
        }

        return _parsers.Any(p =>
            p.SupportedExtensions.Any(ext =>
                ext.Equals(normalized, StringComparison.OrdinalIgnoreCase)));
    }

    private IEnumerable<string> GetAllSupportedExtensions()
    {
        return _parsers.SelectMany(p => p.SupportedExtensions).Distinct(StringComparer.OrdinalIgnoreCase);
    }
}