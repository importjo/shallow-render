import { TestBed } from '@angular/core/testing';
import { Provider } from '@angular/core';
import { Rendering, RenderOptions } from './rendering';
import { createContainer } from '../tools/create-container';
import { copyTestModule } from '../tools/mock-module';
import { isValueProvider } from '../tools/type-checkers';
import { TestSetup } from './test-setup';
import { directiveResolver } from '../tools/reflect';
import { mockProvider } from '../tools/mock-provider';

export class Renderer<TComponent> {
  constructor(private readonly _setup: TestSetup<TComponent>) {}

  private _spyOnProvider(provider: Provider): Provider {
    if (Array.isArray(provider)) {
      return provider.map(p => this._spyOnProvider(p)); // Recursion
    } else {
      if (isValueProvider(provider)) {
        const {provide, useValue} = provider;
        if (provide && !this._setup.dontMock.includes(provide)) {
          Object.keys(useValue).forEach(key => {
            const value = useValue[key];
            if (typeof value === 'function') {
              spyOn(useValue, key).and.callThrough();
            }
          });

          return {provide, useValue};
        }
      }
      return provider;
    }
  }

  async render<TBindings>(html?: string, options?: Partial<RenderOptions<TBindings>>) {
    const finalOptions = {
      detectChanges: true,
      bind: {} as TBindings,
      ...options,
    };

    const ComponentClass = html
      ? createContainer(html, finalOptions.bind)
      : this._setup.testComponent;

    // Components may have their own providers, If the test component does,
    // we will mock them out here..
    const resolvedTestComponent = directiveResolver.resolve(this._setup.testComponent);
    if (resolvedTestComponent.providers && resolvedTestComponent.providers.length) {
      TestBed.overrideComponent(this._setup.testComponent, {
        set: {
          providers: resolvedTestComponent.providers.map(p => mockProvider(p, this._setup))
        }
      });
    }

    const {imports, providers, declarations} = copyTestModule(this._setup);
    await TestBed.configureTestingModule({
        imports,
        providers: providers.map(p => this._spyOnProvider(p)),
        declarations: [...declarations, ComponentClass],
      }).compileComponents();

    const fixture = TestBed.createComponent(ComponentClass);
    if (finalOptions.detectChanges) {
      fixture.detectChanges();
    }

    return new Rendering(fixture, finalOptions.bind, this._setup);
  }
}
