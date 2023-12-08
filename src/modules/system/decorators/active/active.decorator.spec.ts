import { plainToInstance } from 'class-transformer';
import { ActiveFilter } from '../../enums/filter/active-filter/active-filter.enum';
import { BoolMessage } from '../../messages/bool/bool.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { Active } from './active.decorator';

const ActiveMessage = new BoolMessage('active');

describe('Active decorator', () => {
  it('should be defined', () => {
    expect(Active).toBeDefined();
  });

  async function testAccept(
    data: { active: 'all' | 'active' | 'inactive' },
    expected: { active: 'all' | 'active' | 'inactive' },
  ) {
    class Clazz {
      @Active() active: ActiveFilter;
    }

    const errors = await validateFirstError(data, Clazz);
    expect(errors).toHaveLength(0);
    const dto = plainToInstance(Clazz, data);
    expect(dto).toEqual(expected);
  }

  async function testReject(data: { active: ActiveFilter }, constraints) {
    const dtoData = { active: data.active };
    class Clazz {
      @Active() active: ActiveFilter;
    }
    const errors = await validateFirstError(data, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('active');
    expect(errors[0].value).toEqual(data.active);
    expect(errors[0].constraints).toEqual(constraints);
  }

  it(`should pass validation and return "${ActiveFilter.ACTIVE}" when active = null`, async () => {
    await testAccept({ active: null }, { active: ActiveFilter.ACTIVE });
  });

  it(`should pass validation and return "${ActiveFilter.ACTIVE}" when active = undefined`, async () => {
    await testAccept({ active: undefined }, { active: ActiveFilter.ACTIVE });
  });

  it(`should pass validation and return "${ActiveFilter.ACTIVE}" when active = "active"`, async () => {
    await testAccept({ active: 'active' }, { active: ActiveFilter.ACTIVE });
  });

  it(`should pass validation and return "${ActiveFilter.INACTIVE}" when active = "inactive"`, async () => {
    await testAccept({ active: 'inactive' }, { active: ActiveFilter.INACTIVE });
  });

  it(`should pass validation and return "${ActiveFilter.ALL}" when active = "all"`, async () => {
    await testAccept({ active: 'all' }, { active: ActiveFilter.ALL });
  });

  it('active is invalid string', async () => {
    await testReject(
      { active: 'aCtivE' as unknown as ActiveFilter },
      { isEnum: ActiveMessage.INVALID },
    );
  });

  it('active = ""', async () => {
    await testReject(
      { active: '' as unknown as ActiveFilter },
      { isEnum: ActiveMessage.INVALID },
    );
  });

  it('active is boolean', async () => {
    await testReject(
      { active: true as unknown as ActiveFilter },
      { isEnum: ActiveMessage.INVALID },
    );
  });

  it('active is boolean string', async () => {
    await testReject(
      { active: 'true' as unknown as ActiveFilter },
      { isEnum: ActiveMessage.INVALID },
    );
  });

  it('active is number', async () => {
    await testReject(
      { active: 4334556 as unknown as ActiveFilter },
      { isEnum: ActiveMessage.INVALID },
    );
  });

  it('active is object', async () => {
    await testReject(
      { active: {} as unknown as ActiveFilter },
      { isEnum: ActiveMessage.INVALID },
    );
  });

  it('active is array', async () => {
    await testReject(
      { active: [] as unknown as ActiveFilter },
      { isEnum: ActiveMessage.INVALID },
    );
  });
});
