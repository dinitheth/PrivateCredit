declare global {
  interface Window {
    global: typeof globalThis;
    process: { env: Record<string, unknown>; nextTick: (fn: () => void) => void };
    setImmediate: (fn: () => void) => void;
  }
}

class BufferPolyfill {
  data: Uint8Array;

  constructor(input: number | string | ArrayLike<number>) {
    if (typeof input === 'number') {
      this.data = new Uint8Array(input);
    } else if (typeof input === 'string') {
      const encoder = new TextEncoder();
      this.data = encoder.encode(input);
    } else {
      this.data = new Uint8Array(input);
    }
  }

  static from(input: string | ArrayLike<number> | ArrayBuffer, encoding?: string): BufferPolyfill {
    if (typeof input === 'string') {
      if (encoding === 'hex') {
        const bytes = new Uint8Array(input.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(input.substr(i * 2, 2), 16);
        }
        return new BufferPolyfill(bytes);
      }
      if (encoding === 'base64') {
        const binary = atob(input);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return new BufferPolyfill(bytes);
      }
      return new BufferPolyfill(input);
    }
    if (input instanceof ArrayBuffer) {
      return new BufferPolyfill(new Uint8Array(input));
    }
    return new BufferPolyfill(input);
  }

  static alloc(size: number): BufferPolyfill {
    return new BufferPolyfill(size);
  }

  static allocUnsafe(size: number): BufferPolyfill {
    return new BufferPolyfill(size);
  }

  static isBuffer(obj: unknown): boolean {
    return obj instanceof BufferPolyfill;
  }

  static concat(list: BufferPolyfill[]): BufferPolyfill {
    const totalLength = list.reduce((acc, buf) => acc + buf.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of list) {
      result.set(buf.data, offset);
      offset += buf.length;
    }
    return new BufferPolyfill(result);
  }

  get length(): number {
    return this.data.length;
  }

  toString(encoding?: string): string {
    if (encoding === 'hex') {
      let result = '';
      for (let i = 0; i < this.data.length; i++) {
        result += this.data[i].toString(16).padStart(2, '0');
      }
      return result;
    }
    if (encoding === 'base64') {
      let binary = '';
      for (let i = 0; i < this.data.length; i++) {
        binary += String.fromCharCode(this.data[i]);
      }
      return btoa(binary);
    }
    const decoder = new TextDecoder();
    return decoder.decode(this.data);
  }

  toJSON(): { type: 'Buffer'; data: number[] } {
    const dataArray: number[] = [];
    for (let i = 0; i < this.data.length; i++) {
      dataArray.push(this.data[i]);
    }
    return { type: 'Buffer', data: dataArray };
  }

  slice(start?: number, end?: number): BufferPolyfill {
    return new BufferPolyfill(this.data.slice(start, end));
  }

  copy(target: BufferPolyfill, targetStart?: number, sourceStart?: number, sourceEnd?: number): number {
    const source = this.data.slice(sourceStart, sourceEnd);
    target.data.set(source, targetStart || 0);
    return source.length;
  }

  equals(other: BufferPolyfill): boolean {
    if (this.length !== other.length) return false;
    for (let i = 0; i < this.length; i++) {
      if (this.data[i] !== other.data[i]) return false;
    }
    return true;
  }

  fill(value: number | string, start?: number, end?: number): BufferPolyfill {
    const fillValue = typeof value === 'string' ? value.charCodeAt(0) : value;
    this.data.fill(fillValue, start, end);
    return this;
  }

  indexOf(value: number | string): number {
    const searchValue = typeof value === 'string' ? value.charCodeAt(0) : value;
    return this.data.indexOf(searchValue);
  }

  readUInt8(offset: number): number {
    return this.data[offset];
  }

  readUInt16BE(offset: number): number {
    return (this.data[offset] << 8) | this.data[offset + 1];
  }

  readUInt32BE(offset: number): number {
    return (this.data[offset] << 24) | (this.data[offset + 1] << 16) | (this.data[offset + 2] << 8) | this.data[offset + 3];
  }

  writeUInt8(value: number, offset: number): number {
    this.data[offset] = value;
    return offset + 1;
  }

  writeUInt16BE(value: number, offset: number): number {
    this.data[offset] = (value >> 8) & 0xff;
    this.data[offset + 1] = value & 0xff;
    return offset + 2;
  }

  writeUInt32BE(value: number, offset: number): number {
    this.data[offset] = (value >> 24) & 0xff;
    this.data[offset + 1] = (value >> 16) & 0xff;
    this.data[offset + 2] = (value >> 8) & 0xff;
    this.data[offset + 3] = value & 0xff;
    return offset + 4;
  }
}

class EventEmitterPolyfill {
  private listeners: Map<string, Array<(...args: unknown[]) => void>> = new Map();

  on(event: string, listener: (...args: unknown[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    return this;
  }

  once(event: string, listener: (...args: unknown[]) => void): this {
    const onceWrapper = (...args: unknown[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }

  off(event: string, listener: (...args: unknown[]) => void): this {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
    return this;
  }

  emit(event: string, ...args: unknown[]): boolean {
    const eventListeners = this.listeners.get(event);
    if (eventListeners && eventListeners.length > 0) {
      eventListeners.forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  removeListener(event: string, listener: (...args: unknown[]) => void): this {
    return this.off(event, listener);
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
  }

  addListener(event: string, listener: (...args: unknown[]) => void): this {
    return this.on(event, listener);
  }
}

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).global = window;
  
  (window as unknown as Record<string, unknown>).process = (window as unknown as Record<string, unknown>).process || {
    env: {},
    nextTick: (fn: () => void) => setTimeout(fn, 0),
  };
  
  (window as unknown as Record<string, unknown>).Buffer = BufferPolyfill;
  
  (window as unknown as Record<string, unknown>).setImmediate = (window as unknown as Record<string, unknown>).setImmediate || ((fn: () => void) => setTimeout(fn, 0));
  
  (window as unknown as Record<string, unknown>).events = {
    EventEmitter: EventEmitterPolyfill,
  };
}

export { BufferPolyfill as Buffer, EventEmitterPolyfill as EventEmitter };
