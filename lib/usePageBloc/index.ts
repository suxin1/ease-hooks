import { useEffect } from 'react';
import useState from 'react-usestateref';
import { useLocation } from 'react-router-dom';
import cache from './cache';

export type TableDataResponse<T> = {
  data: T[];
  total: number;
};

export type TableAPI = {
  get: <T>(params: any) => Promise<TableDataResponse<T>>;
};

type BlocOptions = {
  idKey?: string;
  selectable?: boolean;
  holdSelection?: boolean;
  selectMode?: 'checkbox' | 'radio';
  initialization?: boolean;
  showPagination?: boolean;
  api: TableAPI;
  pageSizeList?: number[];
  persistent?: boolean;
};

function useTableBloc({
  idKey = 'id',
  initialization = true,
  selectable = false,
  selectMode = 'checkbox',
  showPagination = true,
  holdSelection = false,
  pageSizeList = [10, 20, 30, 50],
  persistent = false,
  ...options
}: BlocOptions) {
  const location = useLocation();
  const cacheData = persistent ? cache.getItem(location.pathname) : {};

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>(cacheData?.data || []);
  const [params, setParams, paramsRef] = useState(cacheData?.params || {});
  const [fixedParams, setFixedParams, FParams] = useState(cacheData?.fixedParams || {});
  const [pagination, setPagination, pageRef] = useState(
    cacheData?.pagination || {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  );

  const [selected, clearSelection, rowConfig] = useSelection({ idKey, selectable, selectMode, holdSelection });
  console.log(pagination, 'pagination');
  useEffect(() => {
    if (initialization) {
      getList();
    }
  }, []);

  useEffect(() => {
    if (persistent) {
      const key = location.pathname;
      cache.setItem(key, {
        data,
        params,
        fixedParams,
        pagination,
      });
    }
  }, [data, params, fixedParams, pagination]);

  async function getList() {
    const { api } = options;
    let newParams = { ...paramsRef.current, ...FParams.current };
    if (showPagination) {
      newParams = {
        ...newParams,
        page: pageRef.current.current,
        size: pageRef.current.pageSize,
      };
    }
    setLoading(true);
    try {
      const { data, total } = await api.get(newParams);
      setData(data);
      setPagination({ ...pageRef.current, total });
    } finally {
      setLoading(false);
    }
  }

  function onPageChange(current, pageSize) {
    setPagination({ ...pagination, current, pageSize });
    getList();
    if (!holdSelection) clearSelection();
  }

  function onFilterReset() {
    setParams({});
    setPagination({ ...pagination, current: 1 });
    getList();
  }

  function onSearch(params) {
    setParams(params);
    clearSelection();
    setPagination({ ...pagination, current: 1 });
    getList();
  }

  function setFixedParamsAndGetList(params) {
    setFixedParams(params);
    getList();
  }

  return {
    tableProps: {
      rowKey: idKey,
      pagination: showPagination && {
        ...pagination,
        onChange: onPageChange,
        pageSizeOptions: pageSizeList,
      },
      rowSelection: rowConfig,
      dataSource: data,
      loading,
    },
    filterProps: {
      onReset: onFilterReset,
      onSubmit: onSearch,
      initialValues: params,
    },
    refresh: getList,
    selected,
    clearSelection,
  };
}

function useSelection(options): [any[], () => void, any] {
  const [selected, setSelected] = useState<any[]>([]);
  const { idKey, selectable, holdSelection, selectMode } = options;

  function addSelection(item: any) {
    setSelected([...selected, item]);
  }

  function setSelection(arr: any[]) {
    setSelected([...arr]);
  }

  function deleteSelection(arr: any[]) {
    const idDict = arr.reduce((acc, item) => {
      acc[item[idKey]] = true;
      return acc;
    }, {});
    setSelected(selected.filter((item) => !idDict[item[idKey]]));
  }

  function onSelectAll(status, selected, changed) {
    if (holdSelection) {
      if (status) {
        addSelection(changed);
      } else deleteSelection(changed);
    } else {
      setSelection(selected);
    }
  }

  function onSelect(changed, status, all) {
    if (holdSelection) {
      if (status) {
        addSelection(changed);
      } else deleteSelection(changed);
    } else {
      setSelection(all);
    }
  }

  function clearSelection() {
    setSelected([]);
  }

  let rowConfig: any = null;
  if (selectable) {
    rowConfig = {
      onSelect,
      onSelectAll,
      selectedRowKeys: selected.map((item) => item[idKey]),
      type: selectMode,
    };
  }

  return [selected, clearSelection, rowConfig];
}

export default useTableBloc;
