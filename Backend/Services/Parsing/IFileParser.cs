using Backend.DTOs;

namespace Backend.Services.Parsing;

/// <summary>
/// Defines a contract for parsing evidence data from a file stream.
/// Implementations handle specific file formats (e.g., CSV, Excel).
/// </summary>
public interface IFileParser
{
    /// <summary>
    /// Parses evidence rows from the provided stream.
    /// </summary>
    /// <param name="stream">The file stream to parse.</param>
    /// <param name="fileName">The original file name (used for format detection or logging).</param>
    /// <returns>A list of parsed evidence preview rows.</returns>
    Task<List<EvidencePreviewRow>> ParseAsync(Stream stream, string fileName);

    /// <summary>
    /// Gets the supported file extensions for this parser (e.g., ".csv", ".xlsx").
    /// </summary>
    IReadOnlyList<string> SupportedExtensions { get; }
}

/// <summary>
/// Factory interface for resolving the appropriate <see cref="IFileParser"/>
/// based on a file extension.
/// </summary>
public interface IFileParserFactory
{
    /// <summary>
    /// Returns a parser capable of handling the given file extension.
    /// </summary>
    /// <param name="fileExtension">The file extension including the leading dot (e.g., ".csv", ".xlsx").</param>
    /// <returns>An <see cref="IFileParser"/> instance for the specified format.</returns>
    /// <exception cref="NotSupportedException">Thrown when no parser supports the given file extension.</exception>
    IFileParser GetParser(string fileExtension);

    /// <summary>
    /// Determines whether a parser exists for the given file extension.
    /// </summary>
    /// <param name="fileExtension">The file extension including the leading dot (e.g., ".csv", ".xlsx").</param>
    /// <returns><c>true</c> if a parser is available; otherwise, <c>false</c>.</returns>
    bool CanParse(string fileExtension);
}