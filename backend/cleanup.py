"""
Temporary file cleanup utility for Resume Studio.

This module provides functions to clean up old temporary PDF and DOCX files
that are generated during resume processing. Files older than a specified
age are automatically removed to prevent disk space issues.
"""

import os
import glob
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Tuple

logger = logging.getLogger(__name__)


def cleanup_temp_files(max_age_hours: int = 24, dry_run: bool = False) -> Tuple[int, List[str]]:
    """
    Remove temporary files older than max_age_hours.
    
    Args:
        max_age_hours: Maximum age in hours for temp files (default: 24)
        dry_run: If True, only report what would be deleted without actually deleting
        
    Returns:
        Tuple of (removed_count, list of removed file paths)
    """
    patterns = ["temp_*.pdf", "temp_*.docx"]
    removed_files = []
    removed_count = 0
    
    logger.info(f"Starting temp file cleanup (max_age: {max_age_hours}h, dry_run: {dry_run})")
    
    for pattern in patterns:
        for filepath in glob.glob(pattern):
            try:
                # Skip if not a file (could be directory in edge cases)
                if not os.path.isfile(filepath):
                    continue
                
                # Get file age
                file_stat = os.stat(filepath)
                file_modified_time = datetime.fromtimestamp(file_stat.st_mtime)
                file_age = datetime.now() - file_modified_time
                
                # Check if file is old enough to delete
                if file_age > timedelta(hours=max_age_hours):
                    if dry_run:
                        logger.info(f"[DRY RUN] Would remove: {filepath} (age: {file_age})")
                        removed_files.append(filepath)
                        removed_count += 1
                    else:
                        os.remove(filepath)
                        removed_count += 1
                        removed_files.append(filepath)
                        logger.info(f"Removed temp file: {filepath} (age: {file_age})")
                else:
                    logger.debug(f"Keeping recent file: {filepath} (age: {file_age})")
                    
            except Exception as e:
                logger.error(f"Failed to process {filepath}: {e}", exc_info=True)
    
    logger.info(f"Cleanup complete. Removed {removed_count} files.")
    return removed_count, removed_files


def get_temp_file_stats() -> dict:
    """
    Get statistics about temporary files in the current directory.
    
    Returns:
        Dictionary with statistics about temp files
    """
    patterns = ["temp_*.pdf", "temp_*.docx"]
    stats = {
        "total_count": 0,
        "total_size_bytes": 0,
        "total_size_mb": 0.0,
        "oldest_file": None,
        "oldest_age_hours": 0,
        "newest_file": None,
        "newest_age_hours": 0,
        "files_by_extension": {}
    }
    
    all_files = []
    
    for pattern in patterns:
        for filepath in glob.glob(pattern):
            if os.path.isfile(filepath):
                file_stat = os.stat(filepath)
                file_modified_time = datetime.fromtimestamp(file_stat.st_mtime)
                file_age_hours = (datetime.now() - file_modified_time).total_seconds() / 3600
                
                all_files.append({
                    "path": filepath,
                    "size": file_stat.st_size,
                    "age_hours": file_age_hours,
                    "extension": Path(filepath).suffix
                })
                
                # Track by extension
                ext = Path(filepath).suffix
                if ext not in stats["files_by_extension"]:
                    stats["files_by_extension"][ext] = {"count": 0, "size_bytes": 0}
                stats["files_by_extension"][ext]["count"] += 1
                stats["files_by_extension"][ext]["size_bytes"] += file_stat.st_size
    
    if all_files:
        stats["total_count"] = len(all_files)
        stats["total_size_bytes"] = sum(f["size"] for f in all_files)
        stats["total_size_mb"] = round(stats["total_size_bytes"] / (1024 * 1024), 2)
        
        # Find oldest and newest
        oldest = max(all_files, key=lambda f: f["age_hours"])
        newest = min(all_files, key=lambda f: f["age_hours"])
        
        stats["oldest_file"] = oldest["path"]
        stats["oldest_age_hours"] = round(oldest["age_hours"], 2)
        stats["newest_file"] = newest["path"]
        stats["newest_age_hours"] = round(newest["age_hours"], 2)
    
    return stats


def cleanup_on_startup(max_age_hours: int = 24):
    """
    Run cleanup on application startup.
    
    This function is designed to be called during FastAPI startup event.
    It logs statistics before and after cleanup.
    
    Args:
        max_age_hours: Maximum age in hours for temp files
    """
    logger.info("=" * 60)
    logger.info("Running startup temp file cleanup")
    logger.info("=" * 60)
    
    # Get stats before cleanup
    before_stats = get_temp_file_stats()
    logger.info(f"Before cleanup: {before_stats['total_count']} files, "
                f"{before_stats['total_size_mb']} MB")
    
    if before_stats['total_count'] > 0:
        logger.info(f"Oldest file: {before_stats['oldest_file']} "
                   f"({before_stats['oldest_age_hours']} hours old)")
    
    # Run cleanup
    removed_count, removed_files = cleanup_temp_files(max_age_hours=max_age_hours)
    
    # Get stats after cleanup
    after_stats = get_temp_file_stats()
    logger.info(f"After cleanup: {after_stats['total_count']} files, "
                f"{after_stats['total_size_mb']} MB")
    logger.info(f"Cleanup freed {before_stats['total_size_mb'] - after_stats['total_size_mb']:.2f} MB")
    logger.info("=" * 60)
    
    return removed_count


if __name__ == "__main__":
    # For manual testing
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    print("\n=== Temp File Statistics ===")
    stats = get_temp_file_stats()
    print(f"Total files: {stats['total_count']}")
    print(f"Total size: {stats['total_size_mb']} MB")
    if stats['total_count'] > 0:
        print(f"Oldest: {stats['oldest_file']} ({stats['oldest_age_hours']}h)")
        print(f"Newest: {stats['newest_file']} ({stats['newest_age_hours']}h)")
        print(f"\nBy extension:")
        for ext, data in stats['files_by_extension'].items():
            print(f"  {ext}: {data['count']} files, {data['size_bytes'] / (1024*1024):.2f} MB")
    
    print("\n=== Running Cleanup (Dry Run) ===")
    count, files = cleanup_temp_files(max_age_hours=24, dry_run=True)
    print(f"Would remove {count} files")
    
    # Uncomment to actually clean
    # print("\n=== Running Cleanup ===")
    # count, files = cleanup_temp_files(max_age_hours=24, dry_run=False)
    # print(f"Removed {count} files")
