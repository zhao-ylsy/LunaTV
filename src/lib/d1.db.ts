/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { AdminConfig } from './admin.types';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import '../types/d1';

// D1 数据库存储实现
export class D1Storage implements IStorage {
  private db: D1Database;

  constructor() {
    // 在 Cloudflare Pages 环境中，DB 会通过绑定注入到全局环境
    this.db = (globalThis as any).DB;
    if (!this.db) {
      throw new Error('D1 database not found. Make sure DB is bound in wrangler.toml');
    }
  }

  // ---------- 播放记录 ----------
  async getPlayRecord(userName: string, key: string): Promise<PlayRecord | null> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM watch_history WHERE user_id = (SELECT id FROM users WHERE username = ?) AND movie_id = ? AND episode = ?')
        .bind(userName, key.split('+')[1], key.split('+')[0])
        .first();

      if (!result) return null;

      return {
        title: result.title as string,
        source_name: key.split('+')[0],
        cover: result.poster as string,
        year: result.year as string,
        index: parseInt(result.episode as string) || 1,
        total_episodes: 1,
        play_time: result.progress as number,
        total_time: result.duration as number,
        save_time: new Date(result.updated_at as string).getTime(),
        search_title: result.title as string,
      };
    } catch (error) {
      console.error('获取播放记录失败:', error);
      return null;
    }
  }

  async setPlayRecord(userName: string, key: string, record: PlayRecord): Promise<void> {
    try {
      const [source, movieId] = key.split('+');

      // 确保用户存在
      await this.ensureUserExists(userName);

      await this.db
        .prepare(`
          INSERT OR REPLACE INTO watch_history 
          (user_id, movie_id, title, poster, year, episode, progress, duration, last_watched, updated_at)
          VALUES (
            (SELECT id FROM users WHERE username = ?),
            ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
          )
        `)
        .bind(
          userName,
          movieId,
          record.title,
          record.cover,
          record.year,
          record.index.toString(),
          record.play_time,
          record.total_time
        )
        .run();
    } catch (error) {
      console.error('保存播放记录失败:', error);
      throw error;
    }
  }

  async getAllPlayRecords(userName: string): Promise<{ [key: string]: PlayRecord }> {
    try {
      const results = await this.db
        .prepare('SELECT * FROM watch_history WHERE user_id = (SELECT id FROM users WHERE username = ?) ORDER BY last_watched DESC')
        .bind(userName)
        .all();

      const records: { [key: string]: PlayRecord } = {};

      for (const row of results.results) {
        const key = `${row.episode}+${row.movie_id}`;
        records[key] = {
          title: row.title as string,
          source_name: row.episode as string,
          cover: row.poster as string,
          year: row.year as string,
          index: parseInt(row.episode as string) || 1,
          total_episodes: 1,
          play_time: row.progress as number,
          total_time: row.duration as number,
          save_time: new Date(row.updated_at as string).getTime(),
          search_title: row.title as string,
        };
      }

      return records;
    } catch (error) {
      console.error('获取所有播放记录失败:', error);
      return {};
    }
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    try {
      const [source, movieId] = key.split('+');

      await this.db
        .prepare('DELETE FROM watch_history WHERE user_id = (SELECT id FROM users WHERE username = ?) AND movie_id = ? AND episode = ?')
        .bind(userName, movieId, source)
        .run();
    } catch (error) {
      console.error('删除播放记录失败:', error);
      throw error;
    }
  }

  // ---------- 收藏 ----------
  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    try {
      const [source, movieId] = key.split('+');

      const result = await this.db
        .prepare('SELECT * FROM favorites WHERE user_id = (SELECT id FROM users WHERE username = ?) AND movie_id = ?')
        .bind(userName, movieId)
        .first();

      if (!result) return null;

      return {
        source_name: source,
        total_episodes: 1,
        title: result.title as string,
        year: result.year as string,
        cover: result.poster as string,
        save_time: new Date(result.created_at as string).getTime(),
        search_title: result.title as string,
      };
    } catch (error) {
      console.error('获取收藏失败:', error);
      return null;
    }
  }

  async setFavorite(userName: string, key: string, favorite: Favorite): Promise<void> {
    try {
      const [source, movieId] = key.split('+');

      // 确保用户存在
      await this.ensureUserExists(userName);

      await this.db
        .prepare(`
          INSERT OR REPLACE INTO favorites 
          (user_id, movie_id, title, poster, year, type, created_at)
          VALUES (
            (SELECT id FROM users WHERE username = ?),
            ?, ?, ?, ?, ?, datetime('now')
          )
        `)
        .bind(
          userName,
          movieId,
          favorite.title,
          favorite.cover,
          favorite.year,
          'movie'
        )
        .run();
    } catch (error) {
      console.error('保存收藏失败:', error);
      throw error;
    }
  }

  async getAllFavorites(userName: string): Promise<{ [key: string]: Favorite }> {
    try {
      const results = await this.db
        .prepare('SELECT * FROM favorites WHERE user_id = (SELECT id FROM users WHERE username = ?) ORDER BY created_at DESC')
        .bind(userName)
        .all();

      const favorites: { [key: string]: Favorite } = {};

      for (const row of results.results) {
        const key = `source+${row.movie_id}`;
        favorites[key] = {
          source_name: 'source',
          total_episodes: 1,
          title: row.title as string,
          year: row.year as string,
          cover: row.poster as string,
          save_time: new Date(row.created_at as string).getTime(),
          search_title: row.title as string,
        };
      }

      return favorites;
    } catch (error) {
      console.error('获取所有收藏失败:', error);
      return {};
    }
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    try {
      const [source, movieId] = key.split('+');

      await this.db
        .prepare('DELETE FROM favorites WHERE user_id = (SELECT id FROM users WHERE username = ?) AND movie_id = ?')
        .bind(userName, movieId)
        .run();
    } catch (error) {
      console.error('删除收藏失败:', error);
      throw error;
    }
  }

  // ---------- 用户管理 ----------
  async registerUser(userName: string, password: string): Promise<void> {
    try {
      await this.db
        .prepare('INSERT INTO users (username, password, created_at, updated_at) VALUES (?, ?, datetime(\'now\'), datetime(\'now\'))')
        .bind(userName, password)
        .run();
    } catch (error) {
      console.error('注册用户失败:', error);
      throw error;
    }
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    try {
      const result = await this.db
        .prepare('SELECT password FROM users WHERE username = ?')
        .bind(userName)
        .first();

      return result ? result.password === password : false;
    } catch (error) {
      console.error('验证用户失败:', error);
      return false;
    }
  }

  async checkUserExist(userName: string): Promise<boolean> {
    try {
      const result = await this.db
        .prepare('SELECT id FROM users WHERE username = ?')
        .bind(userName)
        .first();

      return !!result;
    } catch (error) {
      console.error('检查用户存在失败:', error);
      return false;
    }
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    try {
      await this.db
        .prepare('UPDATE users SET password = ?, updated_at = datetime(\'now\') WHERE username = ?')
        .bind(newPassword, userName)
        .run();
    } catch (error) {
      console.error('修改密码失败:', error);
      throw error;
    }
  }

  async deleteUser(userName: string): Promise<void> {
    try {
      // 删除用户相关的所有数据
      await this.db
        .prepare('DELETE FROM users WHERE username = ?')
        .bind(userName)
        .run();
      // 由于外键约束，相关的收藏和播放记录会自动删除
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }

  // ---------- 搜索历史 ----------
  async getSearchHistory(userName: string): Promise<string[]> {
    // D1 版本暂不实现搜索历史，返回空数组
    return [];
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    // D1 版本暂不实现搜索历史
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    // D1 版本暂不实现搜索历史
  }

  // ---------- 用户列表 ----------
  async getAllUsers(): Promise<string[]> {
    try {
      const results = await this.db
        .prepare('SELECT username FROM users ORDER BY created_at DESC')
        .all();

      return results.results.map(row => row.username as string);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  }

  // ---------- 管理员配置 ----------
  async getAdminConfig(): Promise<AdminConfig | null> {
    // D1 版本暂不实现管理员配置，返回 null
    return null;
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    // D1 版本暂不实现管理员配置
  }

  // ---------- 跳过配置 ----------
  async getSkipConfig(userName: string, source: string, id: string): Promise<SkipConfig | null> {
    // D1 版本暂不实现跳过配置
    return null;
  }

  async setSkipConfig(userName: string, source: string, id: string, config: SkipConfig): Promise<void> {
    // D1 版本暂不实现跳过配置
  }

  async deleteSkipConfig(userName: string, source: string, id: string): Promise<void> {
    // D1 版本暂不实现跳过配置
  }

  async getAllSkipConfigs(userName: string): Promise<{ [key: string]: SkipConfig }> {
    // D1 版本暂不实现跳过配置
    return {};
  }

  // ---------- 数据清理 ----------
  async clearAllData(): Promise<void> {
    try {
      await this.db.prepare('DELETE FROM watch_history').run();
      await this.db.prepare('DELETE FROM favorites').run();
      await this.db.prepare('DELETE FROM users').run();
    } catch (error) {
      console.error('清理数据失败:', error);
      throw error;
    }
  }

  // ---------- 辅助方法 ----------
  private async ensureUserExists(userName: string): Promise<void> {
    const exists = await this.checkUserExist(userName);
    if (!exists) {
      // 如果用户不存在，创建一个默认用户
      await this.registerUser(userName, 'default_password');
    }
  }
}
