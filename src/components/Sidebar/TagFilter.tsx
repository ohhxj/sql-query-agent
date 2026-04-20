import { useState } from 'react';
import { useDatabaseStore } from '@/stores/useDatabaseStore';

export function TagFilter() {
  const { tags, activeTagIds, toggleTag, clearTags, createTag, deleteTag, getFilteredTables } =
    useDatabaseStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      createTag(newTagName.trim());
      setNewTagName('');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTag();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewTagName('');
    }
  };

  if (tags.length === 0 && !isCreating) {
    return (
      <div className="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-tertiary)]">暂无标签</span>
          <button
            onClick={() => setIsCreating(true)}
            className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
          >
            + 新建标签
          </button>
        </div>
        {isCreating && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="标签名称"
              className="flex-1 px-2 py-1 text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
              autoFocus
            />
            <button
              onClick={handleCreateTag}
              className="px-2 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
            >
              添加
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-[var(--text-tertiary)]">标签</span>
        {activeTagIds.length > 0 && (
          <button
            onClick={clearTags}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            清除
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isActive = activeTagIds.includes(tag.id);
          const count = getFilteredTables().filter((t) => t.tags.includes(tag.id)).length;

          return (
            <div key={tag.id} className="group relative">
              <button
                onClick={() => toggleTag(tag.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-500 border border-primary-500'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-default)]'
                }`}
              >
                <span>🏷️</span>
                <span>{tag.name}</span>
                {count > 0 && (
                  <span className="px-1 rounded bg-[var(--bg-overlay)] text-[var(--text-tertiary)]">
                    {count}
                  </span>
                )}
              </button>
              <button
                onClick={() => deleteTag(tag.id)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-risk-high text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          );
        })}

        {isCreating ? (
          <div className="flex gap-1">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tag name"
              className="w-20 px-2 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
              autoFocus
            />
            <button
              onClick={handleCreateTag}
              className="px-1.5 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-[var(--text-tertiary)] hover:text-primary-500 hover:bg-[var(--bg-elevated)] transition-colors border border-dashed border-[var(--border-subtle)]"
          >
            <span>+</span>
            <span>新建</span>
          </button>
        )}
      </div>
    </div>
  );
}
